# Omnexus V1 Enhancement Sprint Plan

This document turns the product audit into an execution plan for the next phase of Omnexus.

The plan is intentionally biased toward refinement, reliability, and loop clarity before major feature expansion.

## Planning Principles

- Protect the core loop first: Program or Quick Session -> Workout -> Progress -> Insight -> Next Workout.
- Prefer narrowing and clarifying existing surfaces over adding new top-level features.
- Ship in vertical slices: UX, frontend, backend, storage, analytics, and test coverage together.
- Every sprint must improve either trust, clarity, retention, or delivery confidence.
- No sprint closes unless the local gate, the CI gate, and manual product QA are all green.

## North Star Outcomes

- Users trust that workouts and progress are saved.
- New users know what to do next within seconds.
- Returning users feel momentum and continuity.
- Release confidence is high enough that polish work does not stall on CI noise.
- AI features feel useful, understandable, and integrated into the product loop.

## Release Themes

### Theme 1: Trust

- Sync transparency
- Guest-to-account continuity
- Fewer hidden failure states

### Theme 2: Clarity

- One dominant daily action
- Fewer overlapping entry points
- Better guided mode consistency

### Theme 3: Retention

- Stronger post-workout reinforcement
- Weekly progress framing
- Better connection between insights and next action

### Theme 4: Delivery Confidence

- Stable E2E signal
- Safer auth and hydration flows
- Better release discipline

## Sprint 0: Planning and Baseline

Duration: 3-5 days

Goal:
Establish execution guardrails and baseline metrics before making major product changes.

Product scope:

- Confirm the primary V1 loop and deprioritize non-core additions.
- Identify the exact screens that must improve first: Dashboard, Train, Workout Complete, Profile/Auth, Guest conversion.

Engineering scope:

- Confirm release gates and branch protections.
- Audit CI pass/fail noise by category.
- Establish baseline metrics for activation, workout completion, sync failures, and retention proxies.

Deliverables:

- Sprint backlog for Sprints 1-4 approved.
- Baseline funnel and reliability metrics documented.
- Owners assigned per workstream.

Exit criteria:

- Team agrees on the single primary product loop.
- Top 10 launch-blocking UX and engineering issues are ticketed.
- CI/release owner identified.

## Sprint 1: Reliability and Release Confidence

Duration: 2 weeks

Status:
Implementation complete in repo as of 2026-03-11. Final Actions validation and manual release QA remain release-owner signoff tasks.

Goal:
Fix trust issues in persistence, auth recovery, and CI so the team can ship product refinements safely.

Primary outcomes:

- Users can tell whether data is local-only, syncing, or synced.
- Guest users have a defined migration path.
- CI failures are actionable instead of noisy.

Product work:

- Add sync state language to workout completion and history-related surfaces.
- Add explicit guest progress migration UX.
- Clarify cloud vs device-only persistence copy in guest mode.

Engineering work:

- Introduce a small sync-state model for critical writes.
- Add retry behavior for session and progress writes.
- Harden auth/profile hydration recovery and explicit failure states.
- Reduce or isolate flaky mobile-auth E2E behavior in CI.

Suggested ticket slices:

1. Workout sync state model
2. Guest-to-account migration flow
3. Auth hydration failure UX
4. CI authenticated-mobile stabilization
5. Sync status analytics instrumentation

Test strategy:

- Unit tests for sync state reducers/helpers
- Integration tests for guest migration logic
- E2E coverage for workout save, logout/login recovery, guest conversion path

Exit criteria:

- No critical user data path is silent on failure.
- Authenticated CI suite produces deterministic signal.
- Guest users can create an account without losing trust in their data.

Execution backlog:

- [Sprint 1 backlog](SPRINT_1_BACKLOG.md)
- [Sprint 1 issue drafts](SPRINT_1_ISSUE_DRAFTS.md)

## Sprint 2: Core Loop Clarity

Duration: 2 weeks

Status:
Implementation complete in repo as of 2026-03-12. Primary CTA hierarchy, dominant CTA analytics, Dashboard secondary-action deconfliction, and cross-surface Quick Session label alignment are implemented. Manual QA and release-owner verification remain signoff tasks.

Goal:
Make the app's primary next action obvious on Dashboard and Train.

Primary outcomes:

- Users always see one dominant next step.
- Quick Session and program-based training no longer compete equally in confusing ways.
- No-program states are clearer and more intentional.

Product work:

- Redesign Dashboard hero and no-program state.
- Restructure Train page around next session readiness.
- Simplify duplicate CTA surfaces for Quick Session, Browse Programs, Start Workout.

Engineering work:

- Refactor CTA composition into reusable decision logic.
- Align copy, selectors, and empty states across Dashboard and Train.
- Add analytics for dominant CTA engagement.

Suggested ticket slices:

1. Dashboard hero simplification
2. Train page action hierarchy cleanup
3. No-program state redesign
4. CTA analytics instrumentation
5. Guided mode language consistency pass

Test strategy:

- Snapshot or component tests for action hierarchy branches
- E2E flows for guest no-program, active program, and Quick Session fallback

Exit criteria:

- The dashboard answer to "what do I do next?" is unambiguous.
- Train page does not present overlapping primary actions.

Execution backlog:

- [Sprint 2 backlog](SPRINT_2_BACKLOG.md)
- [Sprint 2 issue drafts](SPRINT_2_ISSUE_DRAFTS.md)
- [Sprint 2 QA checklist](SPRINT_2_QA_CHECKLIST.md)

## Sprint 3: Motivation and Retention

Duration: 2 weeks

Status:
Implementation complete in repo as of 2026-03-12. Post-workout reinforcement, weekly momentum framing, insight-to-action recommendations, and Sprint 3 retention analytics are implemented. Manual QA and release-owner verification remain signoff tasks.

Goal:
Connect completed work to progress, insights, and the next workout.

Primary outcomes:

- Workout completion feels rewarding and directional.
- Weekly progress is visible and actionable.
- Existing systems like missions, streaks, and insights feel connected.

Product work:

- Improve Workout Complete modal summary and next-step CTA.
- Add weekly progress module on Dashboard.
- Surface block missions and streak momentum more prominently.
- Improve insight framing from analysis to recommended action.

Engineering work:

- Define progress summary data model for dashboard recap.
- Connect adaptation output to next workout context.
- Add event tracking for progress-module engagement.

Suggested ticket slices:

1. Workout complete summary redesign
2. Weekly progress dashboard module
3. Insight-to-action recommendation linking
4. Mission visibility and completion reinforcement

Test strategy:

- Unit tests for weekly progress calculations
- E2E for complete workout -> next step -> train follow-through

Exit criteria:

- Users see a clear reason to come back this week.
- Insights and adaptation visibly influence subsequent training behavior.

Execution backlog:

- [Sprint 3 backlog](SPRINT_3_BACKLOG.md)
- [Sprint 3 issue drafts](SPRINT_3_ISSUE_DRAFTS.md)
- [Sprint 3 QA checklist](SPRINT_3_QA_CHECKLIST.md)

## Sprint 4: AI Quality and Product Cohesion

Duration: 2 weeks

Goal:
Improve AI trust, clarity, and integration without expanding surface area.

Primary outcomes:

- AI loading and fallback behavior is clearer.
- AI outputs are easier to act on.
- AI feels like part of Omnexus, not a separate subsystem.

Product work:

- Standardize AI loading, retry, and degraded-state copy.
- Improve Ask, Insights, and Program Generation outcome framing.
- Review AI disclaimers and expectation-setting copy.

Engineering work:

- Standardize AI request state shape across features.
- Improve timeout handling and fallback telemetry.
- Review token/cost hotspots and caching opportunities.

Suggested ticket slices:

1. Shared AI request state pattern
2. Ask and Insights degraded UX polish
3. Program generation retry/recovery consistency
4. AI telemetry and cost review

Test strategy:

- Unit tests for AI error normalization
- Mocked integration tests for degraded and timeout states
- E2E for generation retry, Ask fallback, Insights error presentation

Exit criteria:

- AI paths are understandable under both normal and degraded conditions.
- AI outputs consistently end in actionable product guidance.

## Sprint 5: Launch Readiness Sweep

Duration: 1 week

Goal:
Consolidate, polish, validate, and freeze V1 refinement work.

Primary outcomes:

- Product and engineering signoff for V1 release.
- No unresolved P0 UX or persistence issues.
- Release runbook reflects actual launch behavior.

Product work:

- Copy and empty-state polish
- Accessibility and mobile affordance sweep
- Manual journey QA across guest, free, and premium states

Engineering work:

- Final gate hardening
- Documentation updates
- Rollback validation
- Production readiness checklist completion

Exit criteria:

- All planned sprint goals are accepted.
- Release candidate passes preview verification and manual QA.
- Known issues list is explicit and acceptable for launch.

## Sprint Metrics

Track these metrics across the sprint plan:

- Onboarding completion rate
- Program generation success rate
- First workout completion rate
- Workout sync failure rate
- Guest-to-account conversion rate
- Dashboard dominant CTA click-through rate
- Completed workout to next workout return rate
- Insights engagement after workout completion
- CI pass rate by gate
- E2E flaky failure count per week

## Sprint Ceremonies

### Planning

- Start with metric review and unresolved regressions.
- Pull only work with clear acceptance criteria.
- Each ticket must declare user impact, owner, and rollout risk.

### Mid-sprint review

- Review whether the sprint is improving trust, clarity, retention, or delivery confidence.
- Cut scope aggressively if verification quality drops.

### Demo

- Demo full user journeys, not isolated components.
- Show what changed in the experience and what metric it should influence.

### Retro

- Classify issues as product, engineering, QA, or process.
- Add one process improvement task to the next sprint at most.

## Definitions

### Definition of Ready

A ticket is ready only if it has:

- Problem statement
- User impact
- Acceptance criteria
- Test plan
- Analytics or success metric
- Explicit decision on guest/auth/premium behavior

### Definition of Done

A ticket is done only if:

- Code is merged behind the correct branch flow
- Local and CI gates are green
- Tests for the changed behavior exist at the right layer
- Manual QA is completed for the affected journey
- Docs or release notes are updated when behavior changed

## Dependencies and Sequencing

- Sprint 1 should complete before major Dashboard or Train changes land.
- Sprint 2 should complete before retention and motivation polish in Sprint 3.
- Sprint 4 should refine AI behaviors after the core loop is clearer.
- Sprint 5 should be mostly validation and targeted polish, not new architecture.

## Recommended Staffing

- Product owner: decides loop priority, acceptance, and launch scope
- Design/UX owner: Dashboard, Train, completion states, empty states, copy
- Frontend owner: page logic, state flows, instrumentation, component UX
- Backend/platform owner: persistence, APIs, auth, migrations, CI, rollout safety
- QA owner: golden-path journey validation and regression gate ownership
