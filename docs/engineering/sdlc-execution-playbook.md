# Omnexus SDLC Execution Playbook

This playbook defines how Omnexus enhancement work should move from idea to production.

It is designed for a product-oriented app with meaningful UX risk, AI dependencies, cloud sync, and mobile/web parity concerns.

## Goals

- Keep changes small, reviewable, and reversible.
- Protect the core product loop while shipping quickly.
- Use tests to lock down behavior before and after refactors.
- Treat release quality as part of product work, not a separate concern.

## Delivery Model

Work should flow through:

Discovery -> Ticket -> Design/Acceptance -> Branch -> TDD/Implementation -> PR -> QA -> Preview -> Production

## VCS Standards

### Branching

- Branch from `dev` for all normal work.
- Use `hotfix/*` from `main` only for urgent production issues.
- Keep branches short-lived. Target 1-3 days of active implementation before PR.
- Prefer stacked or incremental PRs over long-lived branches.

### Branch names

- `feature/<user-facing-change>`
- `fix/<bug-or-regression>`
- `polish/<ux-improvement>`
- `docs/<artifact>`
- `chore/<infrastructure-change>`

Examples:

- `polish/dashboard-primary-cta`
- `fix/guest-migration-data-loss`
- `feature/workout-sync-status`

### Commit discipline

- Use Conventional Commits.
- Prefer small commits that isolate intention.
- Avoid mixing refactors with behavior changes unless the refactor is required.

Good pattern:

1. `test: add failing coverage for dashboard no-program next-step state`
2. `fix: simplify dashboard next-step hierarchy for no-program users`
3. `docs: update sprint plan and release notes for dashboard refinement`

## Work Item Standards

Every ticket should include:

- Problem statement
- User segment affected
- Why now
- Scope boundaries
- Acceptance criteria
- Test plan
- Analytics plan
- Rollout and rollback note

### Ticket classes

Use one of these labels:

- `product-loop`
- `reliability`
- `ux`
- `ai`
- `community`
- `analytics`
- `tech-debt`
- `release-blocker`

### Acceptance criteria format

Use observable language.

Bad:

- Dashboard is better.

Good:

- When a user has no active program, the Dashboard hero shows one primary CTA and one secondary CTA.
- The primary CTA starts Quick Log or Browse Programs based on the defined product rule.
- The no-program state has no duplicate button labels.

## TDD Strategy

Omnexus should use layered TDD, not dogmatic TDD.

### Write tests first when:

- Fixing regressions
- Refactoring logic in reducers, hooks, utils, services, or API routes
- Changing state transitions or async orchestration
- Tightening route guard/auth behavior

### Write tests immediately after implementation when:

- UI changes are mostly layout/copy changes with low logic complexity
- The behavior is difficult to express before design work is complete

### Minimum rule

No meaningful behavior change ships without test coverage at the right layer.

## Testing Pyramid for Omnexus

### Unit tests

Use for:

- utils
- reducers
- pure hook logic
- service request formatting
- API validation helpers

Examples:

- weight conversion
- program generation state parsing
- learning progress reducer transitions
- AI request error normalization

### Integration tests

Use for:

- hooks with app context
- localStorage + state interactions
- db/lib helpers with mocks
- auth/profile recovery behavior

Examples:

- completing a workout updates local state and triggers sync helpers
- guest migration imports local history into authenticated profile flow

### E2E tests

Use for golden journeys only.

Required E2E coverage categories:

- auth and onboarding
- guest mode
- dashboard/train next-step flow
- quick log and program workout flow
- learning journey
- insights/ask critical path
- subscription/paywall boundary

Avoid using E2E to test every visual variation.

## PR Standards

### PR size

- Prefer under 400 changed lines when possible.
- If larger, split by vertical slice or dependency order.

### PR content rules

Every PR should explain:

- what changed
- why it changed
- what risk it introduces
- how it was tested
- whether data migration or rollout handling is required

### Reviewer expectations

Reviewers should check:

- core loop impact
- guest/auth/premium behavior consistency
- async failure handling
- mobile and empty-state behavior
- test coverage quality, not just quantity

### Required PR checks for behavior changes

- local gate passed
- matching tests added or updated
- affected journey manually exercised
- rollout note included

## QA Execution Model

### Golden-path manual QA

Before merge to `main`, manually validate:

1. New user onboarding to first workout
2. Guest setup to workout completion
3. Returning authenticated user hydration
4. Workout completion to history/insight continuity
5. Dashboard no-program and active-program states
6. One AI degraded or failure scenario when touched

### Device policy

- Validate web desktop for all feature work.
- Validate one mobile viewport for all navigation and CTA hierarchy changes.
- Validate native-only concerns separately if Capacitor behavior changed.

## Release and Rollout Practices

### Rollout note required for:

- auth or routing changes
- storage key changes
- profile or data model changes
- AI usage or quota behavior changes
- CI/test policy changes

### Rollout note must state:

- migration required or not
- backward compatibility risk
- fallback behavior
- rollback approach

### Safe rollout sequence

1. merge to `dev`
2. validate DEV environment
3. promote `dev -> main`
4. validate Preview with golden-path QA
5. merge to `main`

## Working with Storage and Sync

Because Omnexus uses localStorage plus Supabase, storage changes are high risk.

Rules:

- Never change key semantics without documenting migration behavior.
- Prefer additive storage changes over destructive ones.
- For any local-first mutation, define what happens if cloud sync fails.
- For guest mode, always define upgrade/migration behavior.

Required checklist for storage-affecting tickets:

- local behavior documented
- authenticated behavior documented
- failure mode documented
- recovery path documented
- test coverage included

## Working with AI Features

Rules for AI changes:

- Always define loading, success, degraded, and failure states.
- Always define what data the AI receives.
- Never rely on AI output shape without validation.
- Separate AI copy improvements from prompt logic changes when possible.
- Track cost-sensitive changes in PR notes.

Required checklist for AI tickets:

- prompt input reviewed
- output validation reviewed
- failure copy reviewed
- rate limit and gating behavior reviewed
- test coverage added for degraded path

## Observability Requirements

Every major enhancement should answer:

- How will we know it worked?
- How will we know it broke?

For user-facing behavior changes, add or update:

- analytics event or property
- error logging point if applicable
- QA note in PR

Minimum telemetry for major flows:

- dashboard primary CTA clicked
- workout sync success/failure
- guest migration started/completed/failed
- program generation success/failure
- insight requested/succeeded/failed

## Definition of Ready

A task is ready when:

- scope is narrow enough to ship in one PR or a small stack
- acceptance criteria are observable
- test approach is known
- product owner agrees on desired behavior for guest/auth/premium
- rollout risk is understood

## Definition of Done

A task is done when:

- code is merged through the correct branch path
- tests exist for changed behavior
- all required gates pass
- manual QA on the impacted journey is complete
- docs, release notes, and migration notes are updated when needed

## Sprint Working Agreement

- Start each sprint with no more than 1-2 P0 items in flight.
- Do not open new enhancement work while release-blocking CI or auth issues are unresolved.
- Reserve at least 15 percent of sprint capacity for regression fixes and validation.
- Product and engineering should demo full user journeys, not isolated components.

## Recommended Cadence

### Daily

- identify blockers
- identify CI failures
- check whether any work item drifted beyond intended scope

### Weekly

- review activation, reliability, and engagement metrics
- review flaky tests and release blockers
- decide whether current work improved trust, clarity, or retention

### End of sprint

- run preview gate
- complete manual QA checklist
- record learnings in docs if process changed
