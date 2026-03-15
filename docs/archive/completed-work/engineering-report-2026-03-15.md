# Engineering Report — Omnexus Production Bug Fix & UX Improvements

_Date: 2026-03-15_

---

## Fixed Issues

### 1. Workout Rest Timer UX Fix

**Root Cause:** `RestTimer.tsx` was rendered at `fixed bottom-24 left-1/2 -translate-x-1/2 z-50` — a floating overlay that blocked unrelated UI and gave no contextual information about which set triggered it.

**What Changed:**
- `useRestTimer.ts` — Added `triggerKey: string | null` state (e.g. `"exerciseIdx-setIdx"`) and `totalSeconds` to track the original duration. `start(duration, key?)` now accepts an optional trigger key.
- `ExerciseBlock.tsx` — Accepts five new props: `restRunning`, `restActiveTriggerKey`, `restCurrentSeconds`, `restTotalSeconds`, and `onStopRest`. After each `<SetRow>`, an inline rest timer appears directly below the completed set. The timer shows "Rest — Set X complete", a live countdown, an accurate progress bar (using `totalSeconds` not a hardcoded 180), and a "Skip" button.
- `ActiveWorkoutPage.tsx` — Removed the standalone `<RestTimer>` import and render. Passes rest state down to each `ExerciseBlock`. `onStartRest` now calls `startRest(restSecs, key)` with the set key.

**Behaviour:** The timer now appears inline, directly below the set that triggered it. No floating overlay. Skip button calls `stopRest()`. Beep-on-complete audio is preserved.

---

### 2. Meal Plan Generation Fix

**Root Cause:** The model name `claude-sonnet-4-6` is not a valid Anthropic model identifier. Additionally, if Claude returned any text outside the JSON block, the simple two-step regex strip would fail silently with a 500.

**What Changed (`api/meal-plan.ts`):**
- Model updated from `claude-sonnet-4-6` → `claude-3-5-sonnet-20241022` (stable production alias).
- Robust JSON extraction: first strips markdown fences and attempts `JSON.parse`; on failure, falls back to extracting the first `{...}` block from the raw response string.
- Schema validation: checks `plan.meals` is a non-empty array before returning 200. Returns 422 with a user-friendly message if the model returns an unexpected format.
- Raw response is logged (truncated) on failure to aid future debugging.

---

### 3. Personal Challenges — Details & Interaction

**Root Cause:** No challenge details page existed; `PersonalChallengeCard` was a non-interactive display with time-based (not metric-based) progress calculation.

**What Changed:**
- **`src/utils/challengeProgress.ts`** (new) — `computeChallengeProgress(challenge, sessions)` returns the actual metric value (sessions count, total kg volume, unique training days, or PR count) for sessions within the challenge window.
- **`src/lib/db.ts`** — Added `updateAiChallengeProgress(challengeId, userId, progress)` (upsert to `challenge_participants`) and `getAiChallengeById(challengeId, userId)`.
- **`src/pages/ChallengeDetailPage.tsx`** (new) — Route `/challenges/:challengeId` shows: title, description, goal metric, target, date window, metric-based progress bar, "Sync to cloud" button, and a completion success state.
- **`src/components/challenges/PersonalChallengeCard.tsx`** — Now uses metric-based progress (`computeChallengeProgress`) instead of days-elapsed. Card is clickable (navigates to detail page). Shows completion state (green checkmark, green progress bar).
- **`src/router.tsx`** — Added `/challenges/:challengeId` lazy route.

---

### 4. Login "Origin Not Allowed" Fix

**Root Cause:** `api/_cors.ts` `DEFAULT_PROD_ALLOWED_ORIGINS` only contained `https://omnexus.netlify.app` and `https://fitness-app-ten-eta.vercel.app`. The production domain `https://omnexus.fit` was absent, so any request from the live site that didn't have `APP_URL` or `ALLOWED_ORIGINS` env vars set would be rejected with 403 "Origin not allowed".

**What Changed (`api/_cors.ts`):**
- Added `https://omnexus.fit` to `DEFAULT_PROD_ALLOWED_ORIGINS`. Production is no longer dependent on env var configuration for the primary domain.

**Remaining action (Supabase dashboard, no code change required):**
- Under Authentication → URL Configuration → Redirect URLs, ensure these are listed:
  - `https://omnexus.fit`
  - `https://omnexus.fit/**`
  - `https://*.vercel.app/**` (for preview deployments)

---

### 5. Stripe Webhook Failures

**Root Cause:** Two causes:
1. Stripe dashboard webhook endpoint was likely set to `https://omnexus.fit` (root) rather than `https://omnexus.fit/api/webhook-stripe`, resulting in 404s.
2. When `webhook-stripe.ts` caught a DB/handler error it returned HTTP 500, which caused Stripe to mark the delivery as failed and retry — eventually exhausting all 14 retries.

**What Changed:**
- **`api/webhook-stripe.ts`** — The `catch` block in the event handler now returns HTTP 200 (not 500). Stripe's retry behaviour is reserved for signature errors (400) and config errors (500 at startup). Transient DB failures are logged and the event is still acknowledged.
- **`api/health.ts`** (new) — GET `/api/health` returns a JSON payload listing which env vars are present (no values exposed). Includes `webhookEndpoint: '/api/webhook-stripe'` as a documented reminder.

**Remaining action (Stripe dashboard):**
- Update the webhook endpoint URL to: `https://omnexus.fit/api/webhook-stripe`
- Confirm `STRIPE_WEBHOOK_SECRET` is set in Vercel production environment.

---

## Architecture Recommendations

1. **Single source of truth for allowed origins** — Move all origin configuration into a typed config object (e.g. `api/_config.ts`) with compile-time guarantees, rather than relying on env var strings to extend a runtime `Set`.

2. **Pre-deploy env var check** — Add a Vercel deployment hook or CI step that runs `/api/health` immediately after deployment and fails the deploy if `status === 'degraded'`. This catches missing secrets before they impact users.

3. **Stripe webhook observability** — Store a `last_webhook_received_at` timestamp in Supabase on every successful webhook. A Grafana/Datadog alert (or a simple cron check against this timestamp) can page on-call if no webhook is received for > 2 hours.

4. **Challenge `progress_pct` computed column** — Add a `progress_pct` generated column to `ai_challenges` (or materialised view) to avoid client-side drift between devices. This also enables server-side leaderboard sorting by challenge completion.

5. **Anthropic model version pinning** — Store the model name in a shared `api/_ai.ts` constant rather than inline strings, so model upgrades are a single-line change with a clear diff.

---

## Codebase Metrics Snapshot

The repository metrics snapshot taken on 2026-03-15 is documented in `../../audit/codebase-metrics-2026-03-15.md`.

### Headline Totals

- Broad tracked text/code scope: 463 files, 86,355 lines.
- Source-only scope: 370 files, 65,737 lines.

### Source-Only Breakdown

- App code: 281 files, 54,059 lines.
- Test code: 89 files, 11,678 lines.
- Frontend: 249 files, 51,723 lines.
- Backend: 75 files, 11,203 lines.
- Supporting: 46 files, 2,811 lines.

### Notable Shape

- The codebase is heavily frontend-weighted, with `src/` alone accounting for 51,351 lines in the broader tracked scope.
- Backend surface area remains comparatively compact at 11,203 lines in `api/`.
- The largest source file is `src/data/courses.ts` at 4,439 lines, followed by several exercise data files and the main typed database helper.

Machine-readable exports are available in `../../audit/codebase-metrics-2026-03-15.json` and `../../audit/codebase-metrics-2026-03-15.csv`.
