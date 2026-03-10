# Omnexus — Setup Procedures

These are the manual steps required to activate features that depend on
third-party services or environment variables.

---

## 1. Rate Limiting (Upstash Redis)

Protects the AI endpoints (`/api/ask`, `/api/onboard`, `/api/generate-program`)
from abuse. Without this, anyone can hammer the endpoints and drain your
Anthropic quota. The code is already written — you just need the credentials.

### Step-by-step

1. Go to [upstash.com](https://upstash.com) and create a free account.

2. Click **Create Database**.
   - Type: **Redis**
   - Name: `omnexus-ratelimit` (or anything you like)
   - Region: pick the one closest to your Vercel deployment (US East if unsure)
   - Plan: **Free tier** is fine

3. Once created, scroll to the **REST API** section of your database page.
   Copy two values:
   - `UPSTASH_REDIS_REST_URL` — looks like `https://xxxxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — long alphanumeric string

4. Open your **Vercel project dashboard** → **Settings** → **Environment Variables**.
   Add both values. Set environment to **Production** (and Preview if you want).

5. **Redeploy** your Vercel project for the variables to take effect.
   (Vercel does not hot-reload env vars — a new deploy is required.)

### Verification

After deploying, make more than 20 requests to `/api/ask` within 10 minutes
from the same IP. The 21st request should return:
```json
{ "error": "Too many requests. Please try again in a few minutes." }
```
with HTTP status `429`.

### Configuration

The limit is defined in `api/_rateLimit.ts`:
```typescript
limiter: Ratelimit.slidingWindow(20, '10 m')
```
Change `20` (max requests) and `'10 m'` (window) to suit your needs.
Common options: `'1 m'`, `'1 h'`, `'1 d'`.

---

## 2. CORS Hardening

Locks down which origins can call your API in production. Without this,
any website can make requests to your endpoints.

### Step-by-step

1. Open your **Vercel project dashboard** → **Settings** → **Environment Variables**.

2. Add a new variable:
   - Name: `ALLOWED_ORIGIN`
   - Value: your production frontend URL, e.g. `https://omnexus.vercel.app`
   - Environment: **Production only** (leave Preview/Development unset so local
     dev keeps using the `*` wildcard)

3. **Redeploy** your Vercel project.

### Verification

After deploying, open browser DevTools on a different website (e.g. google.com)
and run:
```javascript
fetch('https://your-app.vercel.app/api/ask', { method: 'POST' })
```
You should get a CORS error. From your own app's origin, requests should work normally.

---

## 3. E2E Automated Testing (Playwright)

### One-time setup

#### 3a. Create a dedicated test Supabase account

**Do not use your personal account** — tests may create and modify data.

1. Go to your [Supabase dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** → **Users** → **Add User**.
3. Create a user with:
   - Email: something like `e2e-test@yourdomain.com`
   - Password: a strong password you'll remember
4. Make sure the user's email is **confirmed** (toggle in the dashboard if needed).
5. Manually complete onboarding for this account once so it has a `profiles` row.
   (Sign in through the app, go through the flow, then you can use it for tests.)

#### 3b. Create your local test environment file

```bash
cp .env.test.example .env.test
```

Then open `.env.test` and fill in:
```
E2E_BASE_URL=http://localhost:5173
E2E_TEST_EMAIL=e2e-test@yourdomain.com
E2E_TEST_PASSWORD=your-test-password
```

`.env.test` is in `.gitignore` — it will never be committed.

### Running tests

Make sure your dev server is running first (Playwright starts it automatically,
but it's faster if it's already running):

```bash
# Terminal 1 — keep running
vercel dev

# Terminal 2 — run tests
npm run test:e2e           # headless (fastest, good for CI)
npm run test:e2e:headed    # watch the browser live (good for debugging)
npm run test:e2e:ui        # interactive Playwright UI with time-travel
npm run test:e2e:report    # open the last HTML report
```

### Test file structure

```
tests/e2e/
  helpers/
    auth.ts          ← shared signIn(), signOut(), enterAsGuest() helpers
  auth.spec.ts       ← login, logout, guest mode, session persistence
  navigation.spec.ts ← bottom nav tabs, back buttons
  programs.spec.ts   ← browse, activate, detail page, 8-week roadmap
  workout.spec.ts    ← start, discard, refresh restore, history
  library.spec.ts    ← search, filter by muscle, exercise detail
  learn.spec.ts      ← course list, open course, semantic search
```

### Adding new tests

1. Create a new file in `tests/e2e/` with the `.spec.ts` extension.
2. Import helpers from `./helpers/auth` as needed.
3. Use `test.beforeEach` to set up the authenticated state.

Example skeleton:
```typescript
import { test, expect } from '@playwright/test';
import { enterAsGuest } from './helpers/auth';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('does something', async ({ page }) => {
    await page.goto('/some-route');
    await expect(page.getByRole('heading', { name: /expected/i })).toBeVisible();
  });
});
```

### Running in CI (GitHub Actions)

Add this to `.github/workflows/ci.yml` after your existing lint/test jobs:

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run test:e2e
      env:
        E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
        E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
        E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

Add `E2E_BASE_URL`, `E2E_TEST_EMAIL`, and `E2E_TEST_PASSWORD` as
**GitHub repository secrets** (Settings → Secrets and variables → Actions).

---

## 4. Friend Feed PostgREST Join (Supabase)

The friend feed query now attempts a single-query join between
`workout_sessions` and `profiles`. For this to work, Supabase needs to
know about the relationship.

### Step-by-step

1. Open your **Supabase dashboard** → **Table Editor** → `workout_sessions`.
2. Check that `user_id` has a **foreign key** pointing to `auth.users(id)`.
   (It almost certainly does — this is standard.)
3. In the **Table Editor** → `profiles`, confirm `id` also references `auth.users(id)`.

If both FK relationships exist, the join query will work automatically.
If not, the code **falls back to two parallel queries** — nothing breaks.

To verify the join is working: open Supabase **SQL Editor** and run:
```sql
select
  ws.id,
  ws.user_id,
  p.name
from workout_sessions ws
inner join profiles p on p.id = ws.user_id
limit 5;
```
If this returns rows, the join is configured correctly.

---

## 5. Avatar Storage (Supabase Storage)

Enables profile picture uploads. The upload code is already in `ProfilePage.tsx` —
you just need to create the storage bucket and apply the access policies.

### Step-by-step

1. Open your **Supabase dashboard** → **Storage** → **New bucket**.
   - Name: `avatars`
   - Toggle **Public** ON (so uploaded images can be viewed by anyone with the URL)
   - Click **Create bucket**

2. Open the **SQL Editor** and run the contents of `docs/migrations/007_storage_avatars.sql`:
   ```sql
   CREATE POLICY "Users can upload own avatar" ...
   CREATE POLICY "Users can update own avatar" ...
   CREATE POLICY "Users can delete own avatar" ...
   CREATE POLICY "Public can view avatars" ...
   ```

### Verification

Sign in → Profile page → tap the camera icon → select a photo.
The avatar should appear immediately and persist on page refresh.
Check **Supabase → Storage → avatars** to confirm the file is there under `{userId}/`.

---

## 6. Premium Tier (Stripe)

Enables the subscription paywall, usage limits, and the `/subscription` page.

### Step-by-step

#### 6a. Stripe setup

1. Create a [Stripe account](https://stripe.com) (use test mode while developing).
2. Go to **Products** → **Add product**:
   - Name: `Omnexus Premium`
   - Price: set your monthly price (e.g. $9.99/month, recurring)
   - Copy the **Price ID** — it looks like `price_1ABC...`
3. Go to **Developers** → **API keys**:
   - Copy your **Publishable key** (`pk_test_...` for test mode)
   - Copy your **Secret key** (`sk_test_...` for test mode)
4. Go to **Developers** → **Webhooks** → **Add endpoint**:
   - URL: `https://your-app.vercel.app/api/webhook-stripe`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the **Signing secret** (`whsec_...`)

#### 6b. Supabase SQL migrations

Run the following SQL in the **Supabase SQL Editor** (in order):

```sql
-- Add Stripe customer ID to profiles
ALTER TABLE profiles ADD COLUMN stripe_customer_id text UNIQUE;

-- Subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily AI usage tracking
CREATE TABLE user_ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  ask_count int NOT NULL DEFAULT 0,
  program_gen_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can view own usage" ON user_ai_usage
  FOR SELECT USING (auth.uid() = user_id);
```

#### 6c. Environment variables

Add to **Vercel dashboard** → Settings → Environment Variables:

| Variable | Value | Environment |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...`) | Production (or All) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `STRIPE_PRICE_ID` | `price_...` | Production (or All) |
| `APP_URL` | `https://your-app.vercel.app` | Production |

Also add to your local `.env.local` for development (use test keys):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
APP_URL=http://localhost:3000
```

For local webhook testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
```bash
stripe listen --forward-to localhost:3000/api/webhook-stripe
```

#### 6d. Redeploy

After adding env vars, redeploy your Vercel project.

### Verification (test mode)

1. Sign in → visit `/subscription` → click **Upgrade to Premium**
2. Use test card `4242 4242 4242 4242`, any future expiry, any CVC
3. After payment: redirected to `/subscription?success=true` → Premium status shown
4. Ask page → send 6th question → succeeds (no limit hit)
5. Profile page → shows "Premium" badge

---

## Summary — Your Action Items

| Priority | Task | Time |
|----------|------|------|
| 🔴 High | Add `ALLOWED_ORIGIN` to Vercel env vars + redeploy | 2 min |
| 🔴 High | Create Upstash account + add 2 env vars to Vercel + redeploy | 10 min |
| 🔴 High | Create `avatars` storage bucket + run SQL policies (Section 5) | 5 min |
| 🔴 High | Run Stripe SQL migrations + add Stripe env vars (Section 6) | 20 min |
| 🟡 Medium | Create E2E test Supabase account + `.env.test` file | 5 min |
| 🟡 Medium | Run `npm run test:e2e` to verify tests pass | 5 min |
| 🟢 Low | Verify PostgREST FK join in Supabase SQL Editor | 2 min |
| 🟢 Low | Add E2E secrets to GitHub Actions for CI | 5 min |
