# Platform Setup Checklist

This document is the exact list of things you still need to do manually outside the repo.

If you only do work that the coding agent cannot do for you, this is your list.

---

## 1. GitHub branch protection

Do this in GitHub repository settings.

Path:

- `GitHub -> Omnexus repo -> Settings -> Branches -> Add rule`

### Rule for `dev`

Create a branch protection rule for `dev` with these settings:

- Branch name pattern: `dev`
- Require a pull request before merging: `On`
- Require approvals: `1`
- Dismiss stale approvals when new commits are pushed: `Recommended`
- Require review from code owners: `Optional`
- Require status checks to pass before merging: `On`
- Required status checks:
  - `Quality Gate`
  - `Dev Smoke Gate`
- Require branches to be up to date before merging: `On`
- Require conversation resolution before merging: `Recommended`
- Allow force pushes: `Off`
- Allow deletions: `Off`
- Restrict who can push: `Optional`, but recommended if multiple collaborators exist

### Rule for `main`

Create a branch protection rule for `main` with these settings:

- Branch name pattern: `main`
- Require a pull request before merging: `On`
- Require approvals: `1` minimum, `2` if you want stricter production control
- Dismiss stale approvals when new commits are pushed: `On`
- Require status checks to pass before merging: `On`
- Required status checks:
  - `Branch Name Gate`
  - `Quality Gate`
  - `Preview Release Gate`
- Require branches to be up to date before merging: `On`
- Require conversation resolution before merging: `On`
- Allow force pushes: `Off`
- Allow deletions: `Off`

Important:

- If GitHub does not show one of those status checks yet, first open a PR into `dev` and a PR into `main` so Actions runs and registers the check names.

---

## 2. Vercel branch and environment setup

Do this in Vercel project settings.

Path:

- `Vercel -> Project -> Settings`

### Production branch

Set:

- Production Branch: `main`

### DEV environment

You want `dev` to be your shared internal environment.

Important Vercel nuance:

- A deployed `dev` branch is normally a `Preview` deployment in Vercel, not a `Development` deployment
- Vercel `Development` environment variables are mainly for `vercel dev` and local `vercel env pull`
- In the Domains UI, Vercel only lets you assign a domain to `Production` or `Preview`
- A custom DEV hostname such as `dev.omnexus.fit` should therefore be attached as a `Preview` domain and pointed at the `dev` branch deployment
- The simplest setup is:
  - use `Development` variables for local work
  - use `Preview` variables for the hosted `dev` branch and all PR previews
  - use `Production` variables for `main`

Set up:

- `dev` branch deployment enabled
- A stable DEV URL such as `dev.omnexus.fit`

If Vercel does not automatically assign that stable DEV URL, add the domain as a `Preview` domain and map it to the `dev` branch deployment.

### Preview environment

Confirm:

- Preview deployments are enabled for pull requests
- `dev -> main` PRs generate a Preview deployment every time

### What the final mapping should be

- Local: `vercel dev`
- DEV: `dev` branch deployment
- Preview: PR deployments, especially `dev -> main`
- Prod: `main`

---

## 3. Vercel environment variables

Do this in:

- `Vercel -> Project -> Settings -> Environment Variables`

Create separate values for:

- `Development`
- `Preview`
- `Production`

Recommended mapping:

- `Development`: local `vercel dev` only
- `Preview`: hosted `dev` branch deployment and PR preview deployments
- `Production`: `main`

Use `docs/ENVIRONMENT_MATRIX.md` while entering them.

Review these variables one by one:

- `ANTHROPIC_API_KEY`
- `APP_URL`
- `ALLOWED_ORIGIN`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `SEED_SECRET`
- `VITE_API_BASE_URL`
- `VITE_SITE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Recommended rules:

- `APP_URL`, `ALLOWED_ORIGIN`, and `VITE_SITE_URL` should all point at the same public base URL for that environment
- Local, DEV, and Preview should use non-production Stripe credentials
- Prod should use live Stripe credentials only
- Preview should not send real customer emails unless you explicitly want that
- `CRON_SECRET` should be set anywhere Vercel cron jobs run

---

## 4. Supabase auth redirect setup

Do this in Supabase.

Path:

- `Supabase -> Authentication -> URL Configuration`

### Site URL

Set the main Site URL to your production app URL.

Example:

- `https://omnexus.fit`

### Redirect URLs

Add all environments you actually use:

- Local:
  - `http://localhost:3000/**`
- DEV:
  - `https://dev.omnexus.fit/**`
- Preview:
  - your Vercel preview URL pattern, or the specific preview URLs you use
- Prod:
  - `https://omnexus.fit/**`

If you use a `www` domain or alternate production hostname, add that too.

Why this matters:

- login redirects
- password reset redirects
- email confirmation redirects
- auth callback flow

---

## 5. Stripe environment setup

Do this in Stripe and Vercel together.

### Stripe mode policy

Use this policy:

- Local: `test`
- DEV: `test`
- Preview: `test`
- Prod: `live`

### Verify these values match the correct environment

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `APP_URL`

### Redirect URL expectation

Make sure Stripe checkout success/cancel URLs point to the correct environment URL:

- local URL in local development
- DEV URL in DEV
- preview URL in Preview
- production URL in Prod

### Webhook expectation

Make sure the webhook secret in Vercel matches the Stripe endpoint for the same environment.

If you only have one webhook endpoint today, document whether Preview should share it or remain isolated.

---

## 6. First dry run after setup

After you finish the platform setup above, do this once to prove the system works.

### Step A: validate the `dev` path

1. Create a small test branch from `dev`
2. Open a PR into `dev`
3. Confirm these checks run and pass:
   - `Branch Name Gate`
   - `Quality Gate`
   - `Dev Smoke Gate`
4. Merge into `dev`
5. Confirm the DEV deployment updates successfully

### Step B: validate the `preview -> prod` path

1. Open a PR from `dev` to `main`
2. Confirm Vercel creates a Preview deployment
3. Confirm these checks run and pass:
   - `Branch Name Gate`
   - `Quality Gate`
   - `Preview Release Gate`
4. Manually test the Preview deployment
5. Merge to `main`
6. Confirm Production deploys cleanly

---

## 7. What you do not need to do

These items are already handled in the repo:

- branch naming and promotion strategy docs
- local/dev/preview verification scripts
- GitHub Actions CI gates
- manual release verification workflow
- `dev` branch creation and remote push

---

## 8. Fastest path

If you want the shortest possible order of operations, do this:

1. Configure GitHub branch protection for `dev`
2. Configure GitHub branch protection for `main`
3. Set Vercel production branch to `main`
4. Assign a stable DEV deployment to `dev`
5. Enter Vercel env vars for Development, Preview, and Production
6. Add Supabase redirect URLs for local, DEV, Preview, and Prod
7. Verify Stripe is test in Local/DEV/Preview and live in Prod
8. Run one dry-run release through `dev -> main`