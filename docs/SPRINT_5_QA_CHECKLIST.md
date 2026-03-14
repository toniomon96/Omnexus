# Sprint 5 QA Checklist

Scope:
Launch-readiness validation for V1 across guest, free-account, and premium-account journeys.

## Preflight

- Pull latest release candidate branch.
- Confirm env vars and third-party services are configured for preview validation.
- Run local verification gate commands.

## Core Journey Validation

### Guest journey

- Onboarding/guest entry works and preserves local progress.
- Dashboard next step is clear.
- Workout completion and history paths are stable.
- Upgrade/create-account CTAs are visible and accurate.

### Free-account journey

- Sign in and hydration flows are stable.
- Program and workout loop works end-to-end.
- AI limits and fallback messaging are accurate.
- Insights and Ask next-step recommendations remain coherent.

### Premium journey

- Premium-only AI behavior and quotas are correct.
- Subscription state and billing portal links resolve correctly.
- No regressions in core workout/program loop.

## Reliability and Recovery

- Auth/profile recovery states present actionable options.
- AI degraded states show clear retry behavior.
- Program generation draft-ready handoff is unambiguous.
- Sync and persistence messaging is clear when applicable.

## Accessibility and Mobile

- Launch-critical controls have accessible names.
- Focus and keyboard navigation work on key actions.
- Mobile layouts are readable and tappable in common viewport sizes.

## Release Gate Checks

- Lint/typecheck/unit/build gates pass in release environment.
- Required E2E release-signal suite passes (`verify:dev`, `verify:preview` for release PR, `verify:prod` for main push).
- Known flaky checks are either passing or explicitly waived with owner approval.

## Signoff Record

- QA owner:
- Product owner:
- Release owner:
- Date:
- Release candidate build/version:
- Go/No-Go decision:
- Notes:

## Accepted Known Issues Register

List only issues that are explicitly accepted for launch.

| ID | Area | Impact | Workaround | Owner | Fix target |
|---|---|---|---|---|---|
| KI-000 | None accepted as of 2026-03-12 | n/a | n/a | Release owner | Re-evaluate at release PR approval |
| KI-001 | | | | | |

## Release Notes Approval

- Release notes document updated: `docs/SPRINT_5_RELEASE_NOTES.md`
- QA owner approved release notes summary.
- Product owner approved known-issues language.
- Release owner confirmed notes match deployed behavior.

## Automated Evidence Snapshot

- Date: 2026-03-13
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test -- --run`: pass (505 tests across 63 test files)
- `npm run build`: pass (production build ✓)
- `npm run verify:local`: pass
- Notes: local gate includes lint, typecheck, vitest coverage run (505 tests / 63 files), and production build. E2E suite (`verify:prod`) requires a live preview deployment — run via CI or `verify:dev` / `verify:preview` on a Vercel preview branch.
