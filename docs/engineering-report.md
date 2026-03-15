# Omnexus Production Bug Fix & UX Improvement — Engineering Report

_Generated: 2026-03-15_

---

## Issue 1 — Workout Rest Timer UX Fix

**Root cause:** `RestTimer.tsx` was rendered at `fixed bottom-24 left-1/2 -translate-x-1/2 z-50`, a floating overlay that covered unrelated UI elements across the page regardless of which exercise or set triggered the rest.

**What changed:**
- `useRestTimer.ts`: `start()` now accepts optional `exerciseIndex` and `setIndex` parameters and exposes `triggerExerciseIndex` / `triggerSetIndex` in its return value. `stop()` also clears these fields.
- `ExerciseBlock.tsx`: accepts `restIsRunning`, `activeRestSeconds`, `isActiveRestBlock`, `triggerSetIndex`, and `onSkipRest` props. When a rest is active for this block, an inline timer panel is rendered immediately below the set row that triggered the rest. The panel shows "Rest — Set X complete", a countdown with a progress bar, and a "Skip Rest / Start Next Set" button.
- `ActiveWorkoutPage.tsx`: removed the floating `<RestTimer>` component entirely. Passes rest state down to each `ExerciseBlock`, scoped to the correct exercise by index comparison.
- The `RestTimer.tsx` component is no longer used from `ActiveWorkoutPage` (the file is retained for potential other uses but no longer imported by the page).

**Result:** The rest countdown now appears in-context below the completed set, eliminating the z-50 overlay.

---

## Issue 2 — Meal Plan Generation Not Working

**Root cause:** The model identifier `claude-sonnet-4-6` is not a valid stable Anthropic production alias. Additionally, the JSON parser relied on a single regex strip that could fail if the model returned extra text around the JSON block.

**What changed (`api/meal-plan.ts`):**
- Updated model from `claude-sonnet-4-6` to `claude-3-5-sonnet-20241022` (stable production alias).
- Replaced the single-pass regex strip with a two-step parse: attempt `JSON.parse` after stripping markdown fences, then fall back to extracting the first `{…}` block from the raw response string. The raw response (first 500 chars) is logged on failure for observability.
- Added schema validation: if `plan.meals` is missing or an empty array, returns HTTP 422 with a descriptive error message rather than a generic 500.

---

## Issue 3 — Personal Challenges — Details & Interaction

**Root cause:** No drill-down view existed for personal challenges. Progress was computed as `daysPassed / totalDays` (time-elapsed) rather than `currentMetricValue / target` (actual training output). The challenge card was not interactive.

**What changed:**
- `PersonalChallengeCard.tsx`:
  - Added `getMetricProgress()` helper that maps `sessions_count` → `countSessionsLast30Days()` and `total_volume` → `getTotalWeeklyVolumeKg()`. Progress percentage is now `currentValue / target * 100` capped at 100.
  - Card title/description areas are now `<button>` elements that navigate to `/challenges/ai/:id`.
  - Progress bar turns green and shows "✓ Complete!" when `progressPct >= 100`.
- `ChallengeDetailPage.tsx` (new): full detail view showing title, description, metric label, target, start/end dates, days remaining, metric-based progress bar, and a completion state banner.
- `router.tsx`: added `/challenges/ai/:id` route under `AuthOnlyGuard`.

---

## Issue 4 — Login "Origin Not Allowed" Error

**Root cause:** `api/_cors.ts` had a hardcoded `DEFAULT_PROD_ALLOWED_ORIGINS` set that did not include `https://omnexus.fit`, the production domain. If Vercel environment variables (`APP_URL`, `ALLOWED_ORIGINS`) were absent or misconfigured, requests from `omnexus.fit` were rejected with 403.

**What changed (`api/_cors.ts`):**
- Added `https://omnexus.fit` to `DEFAULT_PROD_ALLOWED_ORIGINS`. Production no longer depends on environment variable configuration to allow the primary domain.

**Remaining action (external):** Confirm `APP_URL=https://omnexus.fit` is set in Vercel and that `https://omnexus.fit/**` is listed in Supabase Auth redirect URLs.

---

## Issue 5 — Stripe Webhook Failures

**Root cause:** Two independent failure modes:
1. Stripe webhook endpoint URL in the Stripe dashboard likely pointed to the root domain (`https://omnexus.fit`) instead of the actual handler path (`https://omnexus.fit/api/webhook-stripe`), causing 404s.
2. Transient DB errors in the handler returned HTTP 500, causing Stripe to retry the same event repeatedly.

**What changed:**
- `api/webhook-stripe.ts`: the `catch` block in the event-processing `try/catch` now returns HTTP 200 (instead of 500) so Stripe does not retry on transient errors. The error is still logged via `console.error` for observability.
- `api/health.ts` (new): lightweight health-check endpoint at `/api/health` that checks presence of all required environment variables (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and returns `{"status":"ok"}` or `{"status":"degraded","missingEnvVars":[...]}`. Missing variables are also logged as warnings.

**Remaining actions (external):**
- Update the Stripe dashboard webhook endpoint URL to `https://omnexus.fit/api/webhook-stripe`.
- Verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set in Vercel production.
- Hit `/api/health` after each deployment to confirm all required env vars are present.

---

## Architecture Recommendations

1. **Centralise allowed-origin config.** Move `DEFAULT_PROD_ALLOWED_ORIGINS` to a typed config file (e.g. `api/_config.ts`) exported as a typed constant. This makes it easy to audit and avoids the risk of "silent env-var-only" domains that only work when Vercel vars are correctly set.

2. **Deployment env-var gate.** Add a pre-deploy check (CI step or Vercel build hook) that calls `/api/health` and fails the deployment if `status === "degraded"`. This catches missing secrets at deploy time rather than runtime.

3. **Stripe webhook observability.** Add a Supabase table `webhook_events(event_id text primary key, type text, received_at timestamptz)` and insert a row per processed Stripe event. This provides deduplication (idempotency) and a last-received timestamp visible in the dashboard. The `/api/health` endpoint could surface `lastStripeEvent` from this table.

4. **Challenge progress column.** Consider adding a `progress_pct` computed column or a `challenge_progress` table to Supabase so progress is server-authoritative rather than derived from client-side workout history on every page render. This also enables leaderboard-style progress comparison.
