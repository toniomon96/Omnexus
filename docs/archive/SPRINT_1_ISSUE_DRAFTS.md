# Omnexus Sprint 1 Issue Drafts

Purpose:
These drafts convert Sprint 1 planning into ticket-ready GitHub issues with clear scope, dependencies, and test expectations.

Usage:

- Create one GitHub issue per draft.
- Keep the title format as written unless sprint planning requires refinement.
- Copy the sections into either the feature or bug template as appropriate.
- Link each issue back to `docs/SPRINT_1_BACKLOG.md`.

## P0 Issue 1

Title:
`[Feature] Add visible workout sync status states across completion and history`

Labels:

- `enhancement`
- `reliability`
- `product-loop`
- `release-blocker`

Priority:
P0

Problem:
Workout completion is optimistic locally, but cloud persistence can fail later without a clearly visible product state. This creates trust risk in the app's core loop.

Proposed solution:
Introduce a lightweight sync-status model for completed workouts and expose it in the post-workout flow and latest history entry. The user should be able to distinguish between local save, in-progress sync, confirmed sync, and failed sync.

Scope:

- Define per-session sync states: `Saved on device`, `Syncing`, `Synced`, `Needs attention`
- Persist sync metadata locally until cloud confirmation completes
- Show the state in the workout completion UI
- Show the state in at least one history surface

Acceptance criteria:

- A completed workout always maps to one of the four sync states.
- The state is visible immediately after workout completion.
- The state is visible in a history surface after leaving the workout flow.
- Failed cloud sync never presents as fully successful.
- Unsynced state survives refresh until sync is confirmed or retried.

Implementation notes:

- Prefer additive local metadata over a broad store rewrite.
- Keep workout completion fast; do not block on network success.

Suggested files:

- `src/hooks/useWorkoutSession.ts`
- `src/utils/localStorage.ts`
- `src/pages/HistoryPage.tsx`
- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/store/AppContext.tsx`

Test plan:

- Unit tests for sync-state transitions
- Integration test for optimistic local completion plus failed cloud sync
- E2E coverage for visible post-workout save state

Dependencies:

- None

Definition of done:

- UI state is visible and accurate in both completion and history surfaces
- Tests added for state transition coverage
- Analytics hook points identified for follow-on instrumentation

## P0 Issue 2

Title:
`[Feature] Add manual retry flow for failed workout sync without duplicate sessions`

Labels:

- `enhancement`
- `reliability`
- `tech-debt`

Priority:
P0

Problem:
Users have no first-class recovery flow when workout sync fails, which makes persistence failures feel irreversible.

Proposed solution:
Add a user-triggered retry action for workouts marked `Needs attention`, with clear retry progress and idempotent server write behavior.

Scope:

- Add retry action in the relevant failed-sync UI
- Reflect retry state in the same sync-state model
- Prevent duplicate session creation on repeated retry

Acceptance criteria:

- Users can retry from a failed-sync state.
- Retry visibly updates the sync state.
- Successful retry results in `Synced`.
- Failed retry preserves the local session and keeps the issue recoverable.
- Repeated retry attempts do not create duplicate workout rows.

Suggested files:

- `src/hooks/useWorkoutSession.ts`
- `src/lib/db.ts`
- `src/pages/HistoryPage.tsx`

Test plan:

- Unit tests for retry guard behavior
- Integration test for duplicate-prevention logic

Dependencies:

- P0 Issue 1

Definition of done:

- Retry can be triggered from UI
- Duplicate writes are prevented
- Failure remains recoverable after repeated retries

## P1 Issue 3

Title:
`[Feature] Clarify guest device-only storage on dashboard, history, measurements, and profile`

Labels:

- `enhancement`
- `ux`
- `reliability`

Priority:
P1

Problem:
Guest mode persistence boundaries are easy to miss, which can create perceived data loss later.

Proposed solution:
Add concise, trust-building copy in the highest-risk surfaces explaining that guest progress is saved on the device and can be preserved by creating an account.

Scope:

- Dashboard guest messaging
- History guest messaging
- Measurements guest messaging
- Profile guest messaging

Acceptance criteria:

- Device-only persistence is clearly communicated on all four target surfaces.
- The tone is informative, not alarming.
- The account-creation CTA is tied to preserving progress.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/MeasurementsPage.tsx`
- `src/pages/ProfilePage.tsx`

Test plan:

- E2E or component coverage confirming guest messaging appears in primary surfaces

Dependencies:

- None

Definition of done:

- Copy reviewed for consistency and clarity
- Guest messaging appears only in relevant contexts

## P0 Issue 4

Title:
`[Feature] Prompt guest users to migrate local progress after account creation or first login`

Labels:

- `enhancement`
- `reliability`
- `product-loop`
- `release-blocker`

Priority:
P0

Problem:
Guest users can create meaningful value before signing up, but the app does not yet provide a first-class migration invitation when an account is created.

Proposed solution:
Detect meaningful guest data on authenticated session start and present a migration prompt that explains what can be preserved.

Scope:

- Detect guest data at login or signup completion
- Trigger a migration prompt
- Allow confirm or dismiss behavior
- Preserve guest data if dismissed

Acceptance criteria:

- Local guest data is detected when an authenticated session starts.
- The app presents a prompt describing what will be imported.
- Users can confirm or dismiss.
- Dismissal does not destroy or silently mutate guest data.

Suggested files:

- `src/router.tsx`
- `src/lib/dataMigration.ts`
- `src/contexts/AuthContext.tsx`
- migration modal component or profile surface

Test plan:

- Integration coverage for guest-data detection
- E2E for guest -> auth -> migration prompt

Dependencies:

- Auth hydration behavior should be stable enough for post-login prompt rendering

Definition of done:

- Prompt appears only when real guest data exists
- Copy clearly explains import scope and consequence of dismissal

## P0 Issue 5

Title:
`[Feature] Import guest workouts, learning progress, and preferences into authenticated storage idempotently`

Labels:

- `enhancement`
- `reliability`
- `tech-debt`

Priority:
P0

Problem:
Guest-to-auth migration is incomplete until actual data import is safe, idempotent, and understandable.

Proposed solution:
Implement a migration path for workout history, learning progress, and key preferences with duplicate prevention and clear post-import state.

Scope:

- Map guest workout history to authenticated storage
- Map learning progress where supported
- Map key user preferences
- Prevent duplicate import on retried or repeated flows
- Mark guest data as migrated or archived after success

Acceptance criteria:

- Guest workouts import successfully.
- Learning progress and selected preferences import where applicable.
- Re-running import does not duplicate migrated records.
- Post-success state is explicit in storage behavior.

Suggested files:

- `src/lib/dataMigration.ts`
- `src/lib/db.ts`
- `src/utils/localStorage.ts`
- `api/setup-profile.ts` if needed

Test plan:

- Unit tests for merge rules
- Integration tests for idempotent repeated import

Dependencies:

- P0 Issue 4

Definition of done:

- Migration succeeds for the targeted data classes
- Repeated import remains safe
- Failure mode leaves guest data recoverable

## P0 Issue 6

Title:
`[Bug] Replace silent auth/profile hydration failure states with recoverable user-facing guidance`

Labels:

- `bug`
- `reliability`
- `release-blocker`

Priority:
P0

What happened?
Route and hydration logic can enter confusing states where users experience indefinite loading, unclear onboarding redirects, or non-actionable failure behavior when a profile row is missing or hydration fails.

Expected behavior:
If a session exists but profile recovery or hydration fails, the app should provide a clear next step and should not strand the user on a spinner or ambiguous redirect loop.

Proposed fix:
Add explicit error and recovery states for missing profile, incomplete onboarding, and failed hydration.

Acceptance criteria:

- Missing-profile states never result in indefinite loading.
- Users with incomplete onboarding are guided into the correct recovery path.
- Hydration failure renders a recoverable error state.
- Console-only failures are replaced or supplemented by user-readable guidance.

Suggested files:

- `src/router.tsx`
- `src/lib/profileRecovery.ts`
- `src/lib/dbHydration.ts`
- `src/components/ui/RouterErrorBoundary.tsx`

Test plan:

- Integration coverage for session with missing profile row
- E2E for onboarding-recovery or hydration-failure path

Dependencies:

- None

Definition of done:

- Core auth recovery states are visible and actionable
- No indefinite loader remains for the targeted failure scenarios

## P1 Issue 7

Title:
`[Feature] Instrument auth and hydration state transitions for observability`

Labels:

- `enhancement`
- `analytics`
- `reliability`

Priority:
P1

Problem:
Hydration complexity is a known risk, but the app does not yet emit enough structured telemetry to distinguish failure categories reliably.

Proposed solution:
Instrument hydration and auth state transitions so the team can distinguish missing auth, missing profile, onboarding recovery, and data-fetch failures.

Scope:

- Add structured event emission at critical transitions
- Differentiate failure categories in analytics or logging
- Align event naming to current conventions

Acceptance criteria:

- Hydration transitions are instrumented at the agreed critical points.
- Failure events distinguish auth missing, profile missing, and data-fetch failure.
- Manual QA can verify which events should fire for which flows.

Suggested files:

- `src/router.tsx`
- `src/lib/analytics.ts`
- `src/contexts/AuthContext.tsx`

Test plan:

- Unit tests for instrumentation wrapper or event contract
- Manual QA checklist for event verification

Dependencies:

- P0 Issue 6

Definition of done:

- Events are emitted consistently for the defined states
- Event naming is documented or self-evident in analytics usage

## P0 Issue 8

Title:
`[Feature] Define and document the golden-path E2E matrix for release confidence`

Labels:

- `enhancement`
- `release-blocker`
- `tech-debt`

Priority:
P0

Problem:
CI currently mixes core release-signal coverage with environment-sensitive paths, especially around authenticated mobile flows.

Proposed solution:
Explicitly separate golden-path E2E coverage from unstable or externally constrained paths, and document the intended CI signal.

Scope:

- Identify golden-path coverage that must stay green in CI
- Categorize mobile authenticated flows as supported, skipped, or covered elsewhere
- Update runbook documentation to reflect the policy

Acceptance criteria:

- CI-covered golden-path journeys are explicitly defined.
- Unstable mobile authenticated flows are intentionally categorized.
- Contributors can understand the strategy from docs alone.

Suggested files:

- `playwright.config.ts`
- `tests/e2e/helpers/auth.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/challenges.spec.ts`
- `tests/e2e/community.spec.ts`
- `tests/e2e/insights.spec.ts`
- `docs/CI_RUNBOOK.md`

Test plan:

- Validate updated E2E matrix in docs
- Verify suite selection behavior in CI config and local targeted runs

Dependencies:

- None

Definition of done:

- CI signal strategy is explicit and enforced in code and docs
- Contributors can tell which failures block release and which do not

## P0 Issue 9

Title:
`[Feature] Harden selectors and state setup in golden-path Playwright coverage`

Labels:

- `enhancement`
- `reliability`
- `release-blocker`

Priority:
P0

Problem:
Critical E2E paths still depend on brittle selectors or timing and state assumptions, increasing false negatives in CI.

Proposed solution:
Standardize deterministic selectors or deliberate fallback patterns and ensure shared auth or guest setup is stable before assertions.

Scope:

- Review golden-path specs for brittle selectors
- Add stable hooks where needed
- Make setup helpers establish consistent preconditions

Acceptance criteria:

- Golden-path tests fail only on product regressions or real environment failures.
- Shared helpers establish auth and local state consistently.
- Selector strategy is stable enough to survive low-risk copy changes where intended.

Suggested files:

- `tests/e2e/helpers/auth.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/workout.spec.ts`
- `tests/e2e/measurements.spec.ts`
- target page components if stable selectors are needed

Test plan:

- Targeted Playwright runs for affected journeys
- Manual review of test resilience against safe copy changes

Dependencies:

- P0 Issue 8

Definition of done:

- Shared helpers are deterministic
- Targeted specs use stable selectors or documented fallback patterns

## P1 Issue 10

Title:
`[Feature] Track sync, migration, and hydration outcomes in analytics`

Labels:

- `enhancement`
- `analytics`
- `reliability`

Priority:
P1

Problem:
Sprint 1 changes improve trust, but the team still needs direct visibility into whether failures and recoveries are actually happening in production.

Proposed solution:
Add analytics coverage for workout sync, guest migration, and hydration outcomes so the team can evaluate reliability improvements empirically.

Scope:

- Workout sync success, failure, retry events
- Guest migration started, completed, dismissed, failed events
- Hydration failure category events

Acceptance criteria:

- All target events are emitted from production code paths.
- Event naming follows existing analytics conventions.
- Manual QA can verify event expectations.

Suggested files:

- `src/lib/analytics.ts`
- workout sync call sites
- migration flow call sites
- hydration failure call sites

Test plan:

- Unit tests for analytics wrapper or event helpers where appropriate
- Manual QA verification plan for event emission

Dependencies:

- P0 Issue 1
- P0 Issue 4
- P0 Issue 6

Definition of done:

- Event coverage exists for all targeted Sprint 1 trust-critical flows
- Event naming is consistent and reviewable

## P1 Issue 11

Title:
`[Feature] Update release and QA checklists for workout sync, guest migration, and hydration recovery`

Labels:

- `enhancement`
- `docs`
- `release-blocker`

Priority:
P1

Problem:
Sprint 1 changes affect the most sensitive trust flows and need explicit release validation, not implicit tribal knowledge.

Proposed solution:
Update the release and QA documentation to include trust-critical validation steps introduced in this sprint.

Scope:

- Release checklist updates
- QA checklist updates
- CI runbook updates as needed

Acceptance criteria:

- Release docs include workout sync validation.
- QA steps include guest migration validation.
- CI runbook matches the intended E2E strategy.

Suggested files:

- `docs/RELEASE_CHECKLIST.md`
- `docs/CI_RUNBOOK.md`
- `docs/RELEASE_DAY.md`

Test plan:

- Manual review by release owner or QA owner

Dependencies:

- P0 Issue 8
- P0 Issue 9
- P0 Issue 1
- P0 Issue 4
- P0 Issue 6

Definition of done:

- Release docs reflect all Sprint 1 trust-critical flows
- Manual QA can execute the release checklist without hidden assumptions

## Recommended Creation Order

Create the GitHub issues in this order:

1. P0 Issue 1
2. P0 Issue 2
3. P0 Issue 6
4. P0 Issue 8
5. P0 Issue 9
6. P0 Issue 4
7. P0 Issue 5
8. P1 Issue 10
9. P1 Issue 11
10. P1 Issue 3
11. P1 Issue 7

## Suggested Epic Grouping in GitHub Projects

- Epic A: Save and Sync Trust
- Epic B: Guest Migration
- Epic C: Auth and Hydration Recovery
- Epic D: Release Confidence
- Epic E: Observability and Launch Safeguards