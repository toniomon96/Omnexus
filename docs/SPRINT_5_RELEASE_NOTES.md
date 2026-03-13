# Sprint 5 Release Notes

Date: 2026-03-12
Release scope: Launch Readiness Sweep

## Summary

Sprint 5 focused on launch quality and release confidence rather than net-new feature expansion. The release candidate now has clearer launch-critical UX copy, stronger keyboard/focus accessibility coverage in core flows, and explicit CI gate policy alignment for preview vs production verification.

## Included in this release

### UX and product clarity

- Refined launch-critical copy and empty/degraded-state guidance across:
  - Dashboard
  - Train
  - Ask
  - Insights
  - AI Program Generation
- Clarified guest-vs-account expectations in key states to reduce ambiguity during onboarding and return usage.

### Accessibility and mobile affordance hardening

- Added explicit focus-visible styling to custom interactive cards/buttons in critical pages.
- Added explicit input labeling for Ask question entry.
- Added polite live-region semantics for AI generation/response loading states.
- Preserved existing interaction logic while improving keyboard and assistive-technology affordances.

### Release-gate and CI policy alignment

- Main-branch CI verification now maps explicitly by context:
  - `pull_request` into `main` -> `verify:preview`
  - `push` to `main` -> `verify:prod`
- Updated release/CI docs so gate policy language matches workflow behavior.

### Rollback and incident readiness

- Documented explicit release-day role ownership and rollback trigger policy.
- Clarified rollback handoff steps between rollback owner, QA owner, and comms owner.
- Added checklist-level rollback readiness expectations.

## Known issues accepted for launch

Record only issues explicitly accepted by QA, Product, and Release owners.

Current decision:

- No known issues are accepted for launch as of 2026-03-12.

| ID | Area | Impact | Workaround | Owner | Fix target |
|---|---|---|---|---|---|
| KI-001 | None currently accepted | n/a | n/a | n/a | n/a |

## Verification summary

- Code diagnostics: no errors in edited launch/readiness files.
- Local verification gate passed on 2026-03-12 (`npm run verify:local`), including lint, typecheck, unit coverage, and production build.
- CI/runbook policy docs synchronized with workflow behavior.
- Final manual QA/signoff remains tracked in `docs/SPRINT_5_QA_CHECKLIST.md`.

## Approval record

- QA owner:
- Product owner:
- Release owner:
- Approval date:
