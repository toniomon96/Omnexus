# Omnexus V1 Release Readiness Audit

_Date: 2026-03-15_

This audit compares the active documentation set (`docs/product`, `docs/roadmap`, `docs/engineering`, `docs/architecture`) against the current repository state and local verification results (`npm run lint`, `npm run build`, `npm test -- --run`, `npm run security:audit:prod`).

## 1. V1 Feature Completion Matrix

| Surface | Docs classification | Code audit status | Evidence | Audit notes |
|---|---|---|---|---|
| Onboarding + guest setup | V1 shipped | Fully implemented | `api/onboard.ts`, `src/pages/OnboardingPage.tsx`, `src/pages/GuestSetupPage.tsx`, `tests/e2e/onboarding.spec.ts` | Multi-step onboarding, guest entry, and route coverage all exist. |
| Program generation + program builder | V1 shipped | Fully implemented | `api/generate-program.ts`, `src/lib/programGeneration.ts`, `src/lib/workoutEngine.ts`, `src/pages/AiProgramGenerationPage.tsx`, `src/pages/ProgramBuilderPage.tsx` | Strong deterministic fallback path keeps the feature usable when AI generation fails. |
| Workout logging + history | V1 shipped | Fully implemented | `src/pages/ActiveWorkoutPage.tsx`, `src/hooks/useWorkoutSession.ts`, `src/pages/QuickLogPage.tsx`, `src/pages/HistoryPage.tsx`, `tests/e2e/workout.spec.ts` | Active session restore, inline history editing, and PR handling are all in code. |
| Exercise library | V1 shipped | Partially mismatched with docs | `src/data/exercises/index.ts`, `src/pages/ExerciseLibraryPage.tsx`, `src/pages/ExerciseDetailPage.tsx`, `api/exercise-search.ts`, `tests/e2e/library.spec.ts` | Discovery/detail/search are implemented. The runtime library is currently 307 entries, so this PR normalizes active docs to the less fragile "300+" wording instead of preserving the stale 316 count. |
| Ask Omni AI | V1 shipped | Fully implemented with residual AI risk | `api/ask.ts`, `api/ask-streaming.ts`, `api/checkin.ts`, `api/_aiSafety.ts`, `src/pages/AskPage.tsx`, `tests/e2e/ask.spec.ts` | Coach, Science, Check-In, streaming, and degraded fallback states all exist. |
| Learning system | V1 shipped | Fully implemented | `src/data/courses.ts`, `src/components/learn/QuizBlock.tsx`, `src/utils/spacedRep.ts`, `api/generate-lesson.ts`, `api/recommend-content.ts`, `tests/e2e/learn.spec.ts` | Static course system is deep and well-covered. |
| Gamification + community | V1 shipped | Fully implemented | `src/store/AppContext.tsx`, `src/pages/ChallengesPage.tsx`, `src/pages/FriendsPage.tsx`, `src/pages/ActivityFeedPage.tsx`, `src/pages/LeaderboardPage.tsx`, `tests/e2e/gamification.spec.ts`, `tests/e2e/community.spec.ts` | The social and progression loops are present end to end. |
| Insights + adaptation | V1 shipped | Fully implemented | `api/insights.ts`, `api/adapt.ts`, `api/briefing.ts`, `src/pages/InsightsPage.tsx`, `src/pages/MeasurementsPage.tsx`, `tests/e2e/insights.spec.ts` | AI-backed insight surfaces and supporting charts exist. |
| Nutrition | V1 shipped | Fully implemented for V1, broader AI planning is undocumented | `src/pages/NutritionPage.tsx`, `src/pages/PlateCalculatorPage.tsx`, `api/meal-plan.ts`, `tests/e2e/nutrition.spec.ts` | V1 logging/goals are present; AI meal-plan generation exists in code but is not a clearly framed V1 deliverable. |
| Auth + accounts | V1 shipped | Fully implemented | `api/signup.ts`, `api/signin.ts`, `api/reset-password.ts`, `api/export-data.ts`, `api/delete-account.ts`, `src/pages/AuthCallbackPage.tsx`, `src/components/ui/GuestDataMigrationModal.tsx`, `tests/e2e/auth.spec.ts` | Auth, GDPR, and guest migration all have clear code paths. |
| Premium + Stripe | V1 shipped | Fully implemented | `api/create-checkout.ts`, `api/webhook-stripe.ts`, `api/customer-portal.ts`, `api/subscription-status.ts`, `src/pages/SubscriptionPage.tsx` | Checkout, portal, webhook sync, and gating exist. |
| Push notifications | V1 shipped | Partially implemented across platforms | `public/sw.js`, `src/lib/pushSubscription.ts`, `api/daily-reminder.ts`, `api/training-notifications.ts`, `api/weekly-digest.ts`, `src/pages/NotificationsPage.tsx` | Web Push is implemented. Native push is explicitly unsupported today (`isNative => 'unsupported'`), so there is no cross-platform parity yet. |
| Native + PWA | V1 shipped / roadmap-adjacent | Partially implemented for store readiness | `capacitor.config.ts`, `src/lib/capacitor.ts`, `src/lib/health.ts`, `public/manifest.json`, `public/sw.js`, `docs/engineering/mobile.md` | Capacitor shells and native wrappers exist. PWA support is minimal: manifest + push worker, but no offline caching or install-prompt flow. Wearables are scaffolding only and correctly deferred. |
| Future roadmap: PDF export | Future roadmap | Missing | `docs/roadmap/future-roadmap.md` | No active implementation found in source. |
| Future roadmap: AI form coach / computer vision | Future roadmap | Missing | `docs/roadmap/future-roadmap.md` | No MediaPipe / vision pipeline in app code. |
| Future roadmap: offline-first IndexedDB sync | Future roadmap | Missing | `docs/roadmap/future-roadmap.md`, `public/sw.js` | Current service worker handles push only; there is no offline sync queue or IndexedDB source of truth. |
| Future roadmap: full HealthKit / Health Connect | Future roadmap | Missing beyond scaffolding | `src/lib/health.ts`, `docs/product/v1-scope.md`, `docs/engineering/mobile.md` | Plugin install and platform entitlements are still future work. |

### Summary

- **Fully implemented V1 surfaces:** onboarding, program generation, workout logging, Ask Omni, learning, community/gamification, insights, auth, subscriptions.
- **Partially implemented or documentation-misaligned V1 surfaces:** exercise-library count, cross-platform push parity, mobile/PWA readiness.
- **Clearly missing from current code but already documented as future roadmap:** PDF export, AI form coach, offline-first sync, full wearable ingestion.

## 2. Missing V1 Features

There is **no major documented V1 pillar that is completely absent** from the current web application. The V1 gaps are mostly completeness and launch-readiness gaps:

1. **Cross-platform notification parity is missing.** Web Push works, but native builds intentionally return `unsupported` in `src/lib/pushSubscription.ts`.
2. **PWA readiness is incomplete.** `public/manifest.json` exists, but `public/sw.js` does not implement offline caching, background sync, or install-prompt handling.
3. **Mobile store readiness is incomplete.** `docs/engineering/mobile.md` still lists outstanding icon/splash assets and real-device testing, and the repo does not prove store-submission readiness on its own.
4. **Documentation accuracy is drifting.** The pre-audit docs overstated the exercise count and had stale test totals; this PR corrects the active entry points, but the audit should still be treated as the source of truth for the current 307-entry runtime count.

## 3. Critical Issues Before Release

### Release blockers for a public web V1

1. **Use the documented release path (`dev -> main` or `hotfix/* -> main`) before relying on CI signoff.**  
   `docs/engineering/release-strategy.md` and `.github/workflows/ci.yml` expect that promotion flow. The current branch's `CI` and `Security Ops` runs are `action_required` with no executed jobs, so the PR itself is not a trustworthy release gate.

2. **Run preview-stage manual QA on core user journeys, not just local verification.**  
   Local verification passed cleanly (`npm run lint`, `npm run build`, `npm test -- --run`, `npm run security:audit:prod`), but preview/prod still need manual confirmation for auth, AI, billing, cron, and guest-migration flows.

3. **Decide whether V1 means “public web release” or “web + store launch.”**  
   The codebase is close to web-release ready. It is **not** yet proven store-launch ready because device QA, native asset generation, and native-specific acceptance testing remain outstanding.

### Important but non-blocking issues

- The build still emits a Vite chunking warning because `src/utils/localStorage.ts` is both statically and dynamically imported.
- Large multi-purpose modules (`src/lib/db.ts`, `src/router.tsx`, `src/pages/ProfilePage.tsx`, `src/pages/NutritionPage.tsx`, `src/pages/AskPage.tsx`) raise regression risk.
- Several active docs were stale or stronger than the code evidence warranted.

## 4. Recommended Tests

### Existing automated coverage

- **Local verification passed:** lint, build, 579 Vitest tests, and zero production dependency vulnerabilities.
- **Automated coverage exists across unit/API/E2E layers:** `api/*.test.ts`, `src/**/*.test.ts`, and 20 Playwright specs under `tests/e2e/`.

### Highest-priority additional automated tests

1. **Offline/degraded-mode E2E**
   - Turn network off mid-session.
   - Verify `OfflineNotifier`, active-workout restoration, Ask Omni degradation, and cached article behavior.

2. **Guest-to-account migration + hydration race tests**
   - Cover the interaction between `src/router.tsx`, `src/pages/AuthCallbackPage.tsx`, and local guest data import.

3. **AI response parsing edge cases**
   - Malformed streaming frames in `api/ask.ts`
   - Invalid JSON payloads in `api/adapt.ts`
   - Citation rendering when RAG results are empty or partial

4. **Native/mobile smoke tests**
   - `VITE_API_BASE_URL` correctness in Capacitor builds
   - Blob download behavior for GDPR export on native
   - Back-button, safe-area, and splash/status-bar flows on real devices

5. **Stripe + cron integration checks**
   - Checkout -> webhook -> premium gating
   - Scheduled jobs with `CRON_SECRET`
   - Failure behavior when third-party providers are unavailable

### Manual testing areas and likely failure points

| Area | Why it needs focused testing | Likely failure points |
|---|---|---|
| Onboarding flow | Mixes AI, routing, auth, and guest alternatives | prompt failure, step persistence, redirect loops |
| Workout generation | Depends on AI + deterministic fallback | malformed AI output, loading-state recovery, program save failures |
| Workout logging + rest timers | Dense interactive UI with persistence | lost active session, rest timer UX, finish/discard edge cases |
| Workout history editing | Mutates persisted data after the fact | stale local/server data, invalid set edits |
| Ask Omni | Most complex AI surface | streaming parse failures, prompt injection, citation rendering, fallback copy |
| PubMed feed | External data + caching | stale cache, empty categories, provider/network failures |
| localStorage persistence | Crosses guest and signed-in flows | corrupted state, migration races, version drift |
| Navigation + routing | Heavy guard logic in `src/router.tsx` | hydration timing, guest banners/modals, redirect loops |
| Export/download flows | Web vs native behavior differs | blob downloads in native WebView, auth expiry mid-download |

## 5. Security Risks

### What is already good

- Sensitive secrets stay server-side; browser code only consumes `VITE_*` values.
- `api/_cors.ts` applies CORS checks plus security headers, including CSP and HSTS in production.
- `api/_rateLimit.ts` centralizes rate limiting and fails closed in production if Upstash is missing.
- `npm run security:audit:prod` currently reports **0 production dependency vulnerabilities**.

### Residual risks to address or monitor

1. **AI prompt-context interpolation risk**  
   `api/ask.ts` still interpolates coach-context strings directly into the system prompt (`firstName`, `programName`, `recentPRs`, `currentWeekNote`, `checkInSummary`). This is lower risk than exposing secrets, but it is still the main prompt-injection-adjacent surface.

2. **Plaintext local persistence risk on shared devices**  
   Guest and cached state live in `src/utils/localStorage.ts`. That is fine for product convenience, but it is a privacy trade-off that should be called out in product/security docs.

3. **Third-party AI/provider dependency risk**  
   Anthropic, OpenAI, PubMed, Stripe, Resend, and Supabase failures must degrade cleanly. The code already attempts this in many places, but release QA should explicitly confirm those degraded states.

4. **Operational release-gate risk**  
   If the repo is promoted outside the documented branch flow, CI protections become less trustworthy than intended.

## 6. Deployment Improvements

1. **Keep Node 20 as the authoritative deployment runtime.**  
   The repo declares Node 20 in `package.json` and GitHub Actions uses Node 20.

2. **Audit long-running AI routes in Vercel.**  
   `vercel.json` only sets `maxDuration` for `api/insights.ts`. Confirm whether other AI-heavy routes need explicit durations on the target Vercel plan.

3. **Re-verify environment scopes before launch.**  
   `docs/engineering/environment-matrix.md` is clear, but production safety still depends on the platform configuration being correct for Preview vs Production.

4. **Validate cron configuration in production.**  
   Confirm `CRON_SECRET`, schedules, and alerting for `/api/daily-reminder`, `/api/training-notifications`, `/api/weekly-digest`, and `/api/generate-shared-challenge`.

5. **Treat native builds as a separate deployment profile.**  
   `VITE_API_BASE_URL` must be set correctly for Capacitor builds or `/api/*` calls will fail inside the native WebView.

### Production-safety verdict

- **Web release:** production-safe with disciplined release ops and manual QA.
- **Native app release:** not yet proven production-safe for public store launch.

## 7. Mobile Development Readiness

### Current state

- **Responsive/mobile-first UI:** generally good; the app is already styled and routed like a mobile-first SPA.
- **Capacitor foundation exists:** `capacitor.config.ts`, `ios/`, `android/`, and `src/lib/capacitor.ts` are already in place.
- **PWA readiness is basic only:** manifest exists, but offline behavior is limited and the service worker is push-only.
- **Native constraints are already visible:** native push is unsupported, HealthKit/Health Connect is scaffolding only, and blob downloads may not behave correctly on mobile WebViews.

### Work to finish before serious mobile rollout

1. Real-device QA on iOS and Android
2. App icon/splash asset pipeline
3. Native-specific smoke coverage for auth, AI, export, links, and back-button behavior
4. Explicit offline strategy (even if limited to read-only and cached views for V1)
5. Decision on native push and native file/export support
6. Performance pass on large static bundles (`course-data`, `exercise-data`)

### Best path forward

**Recommendation: stay on Capacitor, keep the web app as the source of truth, and improve the existing wrapper.**

- **Why not PWA only?** Good for installability, but insufficient for app-store packaging and future native features.
- **Why not React Native or Expo wrapper?** The current architecture is already a React/Vite SPA with routed pages, web-first components, and Capacitor helpers. A wrapper switch would add rewrite cost without solving the immediate launch gaps.
- **Why Capacitor fits best:** the repo already has native shells, native utility abstractions, and a documented build path. The fastest safe path is to harden that stack rather than replace it.

## 8. Technical Debt

### Highest priority

1. **Split mega-modules by domain**
   - `src/lib/db.ts`
   - `src/router.tsx`
   - `src/pages/ProfilePage.tsx`
   - `src/pages/NutritionPage.tsx`
   - `src/pages/AskPage.tsx`

2. **Reduce source-of-truth ambiguity**
   - Context, Supabase hydration, and `localStorage` currently overlap heavily.

3. **Formalize AI request/response schemas**
   - AI routes do a lot of manual shaping and fallback handling; stronger schemas would reduce fragility.

### Medium priority

4. **Fix the `localStorage.ts` chunking warning**
5. **Clarify native-vs-web capability boundaries in code**
6. **Revisit bundle strategy for exercise/course data**

## 9. Documentation Improvements

1. **Keep active docs factually current**
   - test totals
   - exercise-library counts
   - release-readiness wording

2. **Add a stable audit entry point**
   - this report should be linked from `docs/README.md` and `README.md`

3. **Clarify which mobile checklist items are externally verified**
   - some `docs/engineering/mobile.md` checklist entries describe owner/platform state, not repo-truth

4. **Refresh or explicitly retire `docs/wiki/`**
   - it is still a stale mirror and should not be treated as authoritative

5. **Add a tighter developer-onboarding narrative**
   - `development-guide.md`, `environment-matrix.md`, `setup-procedures.md`, and `release-strategy.md` all exist, but a one-page “start here as an engineer” flow would reduce ramp-up time

## 10. Step-by-Step V1 Release Checklist

1. Decide whether the immediate target is **web V1 only** or **web + app-store launch**.
2. Promote code through the documented branch policy (`dev -> main` or `hotfix/* -> main`) so CI gates execute as intended.
3. Confirm Preview and Production Vercel environment variables match `docs/engineering/environment-matrix.md`.
4. Re-run `npm run verify:local` on Node 20 and `npm run verify:preview` for the release candidate.
5. Complete manual QA for onboarding, auth, program generation, workout logging, Ask Omni, PubMed feed, guest migration, billing, and notifications.
6. Verify Stripe webhook, cron jobs, and auth callbacks against real deployed infrastructure.
7. Confirm degraded behavior for provider outages and offline/network-loss scenarios.
8. Align active documentation with the actual shipped state and known limitations.
9. If shipping native now: generate store assets, set `VITE_API_BASE_URL`, and run real-device QA on iOS and Android.
10. Record rollback owner, release captain, known issues, and the last-known-good deployment before merge.
11. Merge to `main`, validate production deployment health, and monitor errors/alerts after release.
12. Schedule immediate post-launch work for offline strategy, native push, and module decomposition.
