# Omnexus Sprint 1 Backlog

Sprint name: Reliability and Release Confidence

Recommended duration: 2 weeks

Current status:
Implementation complete in repo as of 2026-03-11. Final CI Actions validation and manual release QA are still required for release-owner signoff.

Primary objective:
Eliminate the highest-risk trust failures in persistence, auth recovery, and release validation so V1 refinement can proceed on a stable foundation.

## Sprint Goal

By the end of Sprint 1:

- Users can tell whether critical data is saved locally, syncing, or synced.
- Guest users have a defined and testable path to save progress into an account.
- Auth and hydration failures degrade clearly instead of silently or via redirect confusion.
- CI provides actionable release signal for the core journeys.

## Sprint Success Metrics

- Workout sync failure events are measurable.
- Guest-to-auth migration flow exists and is manually testable.
- Auth/profile hydration failures no longer result in silent dead ends.
- E2E failures in CI are limited to deterministic product regressions.

## Sprint Scope Guardrails

In scope:

- Sync trust and save-state UX
- Guest migration flow
- Auth/profile hydration recovery clarity
- CI and E2E stabilization for critical user paths
- Observability for these changes

Out of scope:

- Major dashboard redesign beyond trust-related state presentation
- New AI feature expansion
- Community feature expansion
- Broad visual redesigns unrelated to reliability or launch confidence

## Epic 1: Critical Save and Sync Trust

Goal:
Make workout and learning persistence states visible, reliable, and recoverable.

### Story 1.1: Introduce sync status model for workout persistence

Problem:
Workout completion is optimistic locally, but cloud sync can fail later without a sufficiently visible product state.

User story:
As a user, I want to know whether my workout is saved locally, syncing, or fully synced so I can trust the app after I finish a session.

Acceptance criteria:

- A completed workout has one of these explicit states in the UI: `Saved on device`, `Syncing`, `Synced`, or `Needs attention`.
- The state is visible from the post-workout experience and from the most recent history entry.
- If Supabase sync fails, the app shows a non-destructive recovery state instead of implying success.
- The sync state survives page refresh when the workout is still not confirmed as synced.

Engineering notes:

- Prefer a lightweight per-session sync metadata model rather than a broad global rewrite.
- Keep local workout append behavior intact.
- Do not block workout completion on cloud success.

Suggested files:

- `src/hooks/useWorkoutSession.ts`
- `src/utils/localStorage.ts`
- `src/pages/HistoryPage.tsx`
- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/store/AppContext.tsx`

Test plan:

- Unit tests for sync state transitions.
- Integration test for local append + failed cloud sync.
- E2E regression for completed workout showing a visible save state.

Labels:

- `reliability`
- `product-loop`
- `release-blocker`

### Story 1.2: Add retry path for failed workout sync

Problem:
If a workout sync fails, users currently depend on implicit retry or re-login behavior.

User story:
As a user, I want a clear retry path when cloud sync fails so I do not feel like my workout is lost.

Acceptance criteria:

- When a workout is in `Needs attention`, the user can trigger a retry.
- Retry updates the visible sync state immediately.
- If retry succeeds, the state changes to `Synced`.
- If retry fails again, the user keeps the local session and sees a persistent failure state.

Engineering notes:

- Start with manual retry before implementing background queue complexity.
- Avoid duplicate session creation on repeated retry.

Suggested files:

- `src/hooks/useWorkoutSession.ts`
- `src/lib/db.ts`
- `src/pages/HistoryPage.tsx`

Test plan:

- Unit tests for retry guard behavior.
- Integration test for duplicate prevention on repeated retry.

Labels:

- `reliability`
- `tech-debt`

### Story 1.3: Clarify guest device-only persistence in key surfaces

Problem:
Guest storage exists, but the persistence boundary is easy to miss.

User story:
As a guest user, I want to understand what stays on this device and what requires an account so I can make an informed choice.

Acceptance criteria:

- Guest-only persistence language is visible in high-risk screens: Dashboard, History, Measurements, and Profile.
- Copy does not sound alarming, but clearly communicates device-only storage.
- The upgrade path is tied to preserving progress, not just generic account creation.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/MeasurementsPage.tsx`
- `src/pages/ProfilePage.tsx`

Test plan:

- E2E coverage for guest save-state messaging presence in primary surfaces.

Labels:

- `ux`
- `reliability`

## Epic 2: Guest-to-Account Migration

Goal:
Let a guest user preserve meaningful progress when converting to an account.

### Story 2.1: Add migration prompt after guest account creation or first authenticated login

Problem:
Guest users can build value in the app without a first-class import path into authenticated storage.

User story:
As a guest user who creates an account, I want the app to offer to save my existing progress so I do not lose the work I already logged.

Acceptance criteria:

- If local guest data exists and a new authenticated session is established, the app presents a migration prompt.
- The prompt clearly states what will be imported.
- The user can confirm or dismiss the migration.
- Dismissal does not destroy guest data automatically.

Suggested files:

- `src/router.tsx`
- `src/lib/dataMigration.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/ProfilePage.tsx` or a dedicated modal component

Test plan:

- Integration test for guest data detection on authenticated session start.
- E2E coverage for guest -> signup/login -> migration prompt path.

Labels:

- `reliability`
- `product-loop`
- `release-blocker`

### Story 2.2: Implement import for guest workouts, progress, and key preferences

Problem:
Detection alone is not enough; guest data must be merged safely into the authenticated profile.

User story:
As a newly authenticated user, I want my guest workouts and progress to carry over without duplicates or corruption.

Acceptance criteria:

- Guest workout history can be imported into authenticated storage.
- Learning progress and relevant preferences are migrated where appropriate.
- Duplicate sessions are not created if import is retried.
- Guest data is either archived or clearly marked as migrated after success.

Engineering notes:

- Prefer idempotent import behavior.
- Start with workout history, learning progress, and user preferences; do not expand to every table unless required.

Suggested files:

- `src/lib/dataMigration.ts`
- `src/lib/db.ts`
- `src/utils/localStorage.ts`
- `api/setup-profile.ts` if server support is needed

Test plan:

- Unit tests for migration merge rules.
- Integration tests for idempotent import.

Labels:

- `reliability`
- `tech-debt`

## Epic 3: Auth and Hydration Recovery

Goal:
Reduce confusing auth/profile recovery failures and make the app's recovery behavior explicit.

### Story 3.1: Make missing-profile and hydration failures user-readable

Problem:
Current route guards are robust but complex. When profile or hydration goes wrong, the user experience can be unclear.

User story:
As a user, I want clear guidance if my session exists but my profile is incomplete or failed to load.

Acceptance criteria:

- Profile-missing states do not result in indefinite loaders.
- The user sees a clear next step when onboarding must resume.
- Hydration failure surfaces an error state with recovery guidance instead of only console noise.

Suggested files:

- `src/router.tsx`
- `src/lib/profileRecovery.ts`
- `src/lib/dbHydration.ts`
- `src/components/ui/RouterErrorBoundary.tsx`

Test plan:

- Integration test for session with missing profile row.
- E2E coverage for profile recovery or onboarding redirect path.

Labels:

- `reliability`
- `release-blocker`

### Story 3.2: Document and instrument hydration state transitions

Problem:
Hydration complexity is a technical and product risk, and the app currently has limited observable signals for these transitions.

User story:
As the product and engineering team, we want to know where hydration fails so we can reduce support burden and release risk.

Acceptance criteria:

- Hydration states are instrumented at critical points.
- Failures emit structured analytics or logs.
- The app distinguishes auth missing, profile missing, and data fetch failure at the telemetry level.

Suggested files:

- `src/router.tsx`
- `src/lib/analytics.ts`
- `src/contexts/AuthContext.tsx`

Test plan:

- Unit coverage for instrumentation helpers.
- Manual QA note confirming event emission expectations.

Labels:

- `analytics`
- `reliability`

## Epic 4: Release Confidence and E2E Stabilization

Goal:
Make CI failures useful and prevent environment-specific mobile auth issues from blocking product delivery.

### Story 4.1: Separate golden-path E2E coverage from unstable environment-dependent paths

Problem:
Authenticated mobile E2E flows have been noisy and can stall release confidence.

User story:
As the engineering team, we want CI failures to indicate real regressions instead of environment-specific instability.

Acceptance criteria:

- Authenticated mobile flows are explicitly categorized as supported, skipped, or covered elsewhere.
- Golden-path flows remain covered in CI.
- The CI strategy is documented so future contributors understand the intended signal.

Suggested files:

- `playwright.config.ts`
- `tests/e2e/helpers/auth.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/challenges.spec.ts`
- `tests/e2e/community.spec.ts`
- `tests/e2e/insights.spec.ts`
- `docs/CI_RUNBOOK.md`

Test plan:

- Update E2E matrix documentation.
- Manual confirmation that CI scope matches intended release coverage.

Labels:

- `release-blocker`
- `tech-debt`

### Story 4.2: Strengthen deterministic selectors and state setup in golden-path E2E tests

Problem:
Brittle selectors and state assumptions create false negatives in CI.

User story:
As the team, we want critical path E2E tests to fail only when product behavior regresses.

Acceptance criteria:

- Golden-path tests use stable selectors or deliberate fallback patterns.
- Shared auth and guest helpers establish clean state consistently.
- Tests that mutate local storage or auth state do so before assertions in a reliable way.

Suggested files:

- `tests/e2e/helpers/auth.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/workout.spec.ts`
- `tests/e2e/measurements.spec.ts`
- related page components if stable hooks/selectors are needed

Test plan:

- Update affected E2E specs.
- Review CI artifacts expectations in runbook.

Labels:

- `release-blocker`
- `reliability`

## Epic 5: Observability and Launch Safeguards

Goal:
Make Sprint 1 changes measurable and auditable.

### Story 5.1: Add analytics for sync, migration, and hydration outcomes

Problem:
The team cannot improve trust systematically without event-level visibility into failures and recoveries.

User story:
As the team, we want to measure whether reliability work is actually reducing user-facing friction.

Acceptance criteria:

- Events exist for workout sync success, failure, and retry.
- Events exist for guest migration started, completed, dismissed, and failed.
- Events exist for hydration failure categories.
- Naming follows existing analytics conventions.

Suggested files:

- `src/lib/analytics.ts`
- call sites in workout, auth, and migration flows

Test plan:

- Unit tests for analytics wrapper if needed.
- Manual QA checklist includes event verification.

Labels:

- `analytics`
- `reliability`

### Story 5.2: Update release and QA checklists for trust-critical journeys

Problem:
These changes affect the app's most sensitive flows and must be explicitly validated before promotion.

User story:
As a release owner, I want QA and release docs to include the new trust-critical paths so they are not missed.

Acceptance criteria:

- Release checklist includes workout sync validation.
- QA checklist includes guest migration validation.
- CI runbook reflects the new expected E2E strategy.

Suggested files:

- `docs/RELEASE_CHECKLIST.md`
- `docs/CI_RUNBOOK.md`
- `docs/RELEASE_DAY.md`

Labels:

- `docs`
- `release-blocker`

## Sprint Dependency Order

Recommended implementation order:

1. Story 1.1
2. Story 1.2
3. Story 3.1
4. Story 4.1
5. Story 4.2
6. Story 2.1
7. Story 2.2
8. Story 5.1
9. Story 5.2
10. Story 1.3
11. Story 3.2

Rationale:

- Establish sync-state primitives first.
- Stabilize auth and CI before broad UX or migration work.
- Add migration only after persistence and auth states are clearer.
- Finish with observability and release documentation.

## Suggested Sprint Board Columns

- Ready
- In progress
- In review
- QA
- Done

## Suggested Owner Split

- Frontend owner: Stories 1.1, 1.2, 1.3, 3.1
- Platform owner: Stories 2.2, 3.2, 4.1, 5.1
- QA/release owner: Stories 4.2, 5.2
- Product/design owner: Stories 2.1, 1.3, acceptance review for 3.1

## Sprint Review Demo Script

Demo these journeys in order:

1. Guest logs a workout and sees save-state clarity
2. Guest creates account and is offered migration
3. Authenticated user completes workout and sees sync outcome
4. Simulated sync failure and retry recovery path
5. Profile recovery or hydration failure path
6. CI artifact strategy and updated release checklist

## Definition of Done for Sprint 1

Sprint 1 is complete only when:

- All P0 stories are merged or explicitly descoped.
- The core trust journeys are manually validated.
- The release docs reflect the new behavior.
- CI gives deterministic signal on the core product journeys.

Related execution docs:

- [Sprint 1 issue drafts](SPRINT_1_ISSUE_DRAFTS.md)
