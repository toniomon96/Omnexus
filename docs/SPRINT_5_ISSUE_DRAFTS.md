# Omnexus Sprint 5 Issue Drafts

Purpose:
Ticket-ready issue drafts for launch-readiness execution and release signoff.

## P0 Issue 1

Title:
[Release] Complete launch-critical copy and empty-state polish across core loop

Labels:

- release
- ux
- product-loop

Priority:
P0

Problem:
Inconsistent or unclear copy in launch-critical states can create user confusion despite stable underlying behavior.

Acceptance criteria:

- Core-loop copy is concise, actionable, and consistent.
- Empty/degraded states provide explicit next steps.
- Guest vs account expectations are clear.

Suggested files:

- src/pages/DashboardPage.tsx
- src/pages/TrainPage.tsx
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

## P0 Issue 2

Title:
[Release] Run accessibility and mobile affordance sweep for launch paths

Labels:

- release
- accessibility
- mobile

Priority:
P0

Problem:
Unverified mobile/accessibility regressions can block production confidence at launch time.

Acceptance criteria:

- Launch-critical controls have accessible names and focus states.
- Key paths remain usable on common mobile viewport sizes.
- No clipping/overlap blocks core actions.

Suggested files:

- src/components
- src/pages
- src/styles/index.css

## P0 Issue 3

Title:
[Release] Finalize verification gates and CI release signal policy

Labels:

- release
- ci
- testing

Priority:
P0

Problem:
Release confidence drops when gate expectations drift from current scripts and workflow behavior.

Acceptance criteria:

- Local and CI gate commands are aligned.
- Flaky checks are documented and either stabilized or scoped.
- Runbook steps match reality.

Suggested files:

- package.json
- .github/workflows
- docs/CI_RUNBOOK.md
- docs/E2E_TEST_MATRIX.md

## P1 Issue 4

Title:
[Release] Validate rollback checklist and incident owner responsibilities

Labels:

- release
- operations

Priority:
P1

Problem:
Rollback ambiguity during release incidents increases downtime and coordination errors.

Acceptance criteria:

- Rollback checklist is current and executable.
- Release-day owner roles and handoff points are explicit.

Suggested files:

- docs/RELEASE_STRATEGY.md
- docs/RELEASE_CHECKLIST.md

## P1 Issue 5

Title:
[Release] Capture final QA signoff and accepted known-issues list

Labels:

- release
- qa
- documentation

Priority:
P1

Problem:
Launch readiness cannot be audited without explicit signoff and known-issues traceability.

Acceptance criteria:

- QA owner/product owner/release owner signoff captured.
- Accepted known issues documented with impact and workaround.

Suggested files:

- docs/SPRINT_5_QA_CHECKLIST.md
- docs/ROADMAP.md
- README.md
