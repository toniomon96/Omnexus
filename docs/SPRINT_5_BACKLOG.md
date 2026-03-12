# Omnexus Sprint 5 Backlog

Sprint name: Launch Readiness Sweep

Recommended duration: 1 week

Primary objective:
Consolidate, validate, and freeze V1 refinement work with explicit release signoff across product, QA, and engineering.

## Sprint Status

Current status:

- Sprint 5 started in repo on 2026-03-12.
- Sprint 4 implementation scope is complete in repo.
- Story 1.1 copy and empty-state polish is implemented across launch-critical pages.
- Story 1.2 accessibility/mobile hardening is implemented across launch-critical pages; final manual viewport QA is pending.
- Story 2.1 release gate hardening is implemented; CI and release docs now use explicit preview vs production verification command mapping.
- Story 2.2 rollback and incident response readiness docs are implemented with explicit release-day role and handoff expectations.
- Story 3.1 and 3.2 signoff/known-issues/release-notes artifacts are implemented; final owner approvals are pending.
- Local gate evidence is clean (`npm run verify:local` passed with lint/typecheck/test coverage/build).
- Remaining launch risk is limited to manual QA completeness, release signoff discipline, and known-issues acceptance decisions.

## Sprint Goal

By the end of Sprint 5:

- Product and engineering sign off on V1 release candidate behavior.
- No unresolved P0 UX, persistence, or auth/hydration regressions.
- Release runbook and checklists match actual deployment behavior.

## Sprint Success Metrics

- Preview environment passes full verification gates.
- Manual journey QA pass rate is 100% for guest, free, and premium key paths.
- No untriaged P0 defects remain before promotion.
- Known-issues list is explicit, reviewed, and accepted.

## Scope Guardrails

In scope:

- Final copy and empty-state polish for launch-critical surfaces.
- Accessibility and mobile affordance sweep.
- Final release-gate and rollback readiness verification.
- Documentation and release checklist finalization.

Out of scope:

- New feature expansion beyond release blockers.
- Large architecture refactors unrelated to launch quality.
- Non-critical visual redesign work.

## Epic 1: Product and UX Final Pass

Goal:
Eliminate confusing launch-critical UX rough edges.

### Story 1.1: Final copy and empty-state polish for critical journeys

Acceptance criteria:

- Copy on Dashboard, Train, Ask, Insights, and Program flows is concise and unambiguous.
- Empty and degraded states provide clear next actions.
- Guest vs account behavior is explicit where relevant.

Suggested files:

- src/pages/DashboardPage.tsx
- src/pages/TrainPage.tsx
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

### Story 1.2: Accessibility and mobile affordance sweep

Acceptance criteria:

- Interactive controls have accessible names and visible focus behavior.
- Mobile layouts remain readable and actionable in common viewport ranges.
- Critical flows are navigable without layout overlap or clipping.

Suggested files:

- src/components
- src/pages
- src/styles/index.css

## Epic 2: Release Gate and Rollback Readiness

Goal:
Ensure promotion gates and rollback plans are trustworthy under release pressure.

### Story 2.1: Final gate hardening and verification walkthrough

Acceptance criteria:

- Local verification scripts are current and documented.
- CI gate expectations align with release policy docs.
- Any remaining flaky checks are isolated or clearly documented.

Suggested files:

- package.json
- .github/workflows
- docs/CI_RUNBOOK.md
- docs/E2E_TEST_MATRIX.md

### Story 2.2: Rollback and incident response readiness check

Acceptance criteria:

- Rollback path is documented and tested at checklist level.
- Owner responsibilities are clear for release-day incidents.

Suggested files:

- docs/RELEASE_STRATEGY.md
- docs/RELEASE_CHECKLIST.md

## Epic 3: Launch Signoff and Documentation Freeze

Goal:
Close the sprint with explicit approval records and launch-ready docs.

### Story 3.1: Manual journey QA signoff capture

Acceptance criteria:

- Guest, free, and premium launch journeys are manually validated.
- QA outcomes and owners are recorded in a single checklist.

Suggested files:

- docs/SPRINT_5_QA_CHECKLIST.md

### Story 3.2: Known issues and release notes finalization

Acceptance criteria:

- Accepted known issues are documented with impact and workaround.
- Release notes summarize launch-relevant changes accurately.

Suggested files:

- README.md
- docs/ROADMAP.md
- release notes artifact (if maintained externally)
