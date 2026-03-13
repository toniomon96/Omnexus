# E2E Test Matrix

This document defines which Playwright coverage is expected to provide release signal in each environment.

## Principles

- Dev CI should fail on deterministic product regressions in the core user journeys.
- Preview and production verification may run broader coverage, but golden-path failures always take priority.
- Authenticated mobile flows are not treated as blocking CI signal until their environment-specific instability is removed.
- Tests that require live credentials or external delivery behavior must be explicitly categorized rather than silently mixed into the main release gate.

## Golden-Path Chromium Matrix

These specs form the default release-signal set for `dev` verification:

- `tests/e2e/navigation.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/workout.spec.ts`
- `tests/e2e/learn.spec.ts`
- `tests/e2e/nutrition.spec.ts`

Golden-path expectations:

- Runs in desktop Chromium only.
- Must be deterministic enough to gate merges into `dev`.
- Covers the primary app shell, guest entry, dashboard, workout flow, learning flow, and nutrition flow.

## Extended Release Coverage

These suites are still important, but are not the primary CI signal for `dev`:

- `tests/e2e/profile.spec.ts`
- `tests/e2e/measurements.spec.ts`
- `tests/e2e/library.spec.ts`
- `tests/e2e/guided-mode.spec.ts`
- `tests/e2e/reliability.spec.ts`
- authenticated community, insights, challenges, and auth flows

Use this broader coverage for:

- preview release validation
- manual release verification
- focused regression confirmation when related code changes

## Unstable or Environment-Constrained Paths

The following paths are currently non-blocking in CI unless explicitly stabilized:

- authenticated mobile flows in `Mobile Chrome`
- flows that depend on fragile third-party auth timing
- email-delivery-dependent flows

Policy:

- Keep these tests in the repo when they provide product value.
- Skip them intentionally when the environment is known to be unreliable.
- Document the skip reason in the test file or helper.
- Do not allow these paths to dominate `dev` gate signal.

## Command Matrix

| Command | Intended use | Scope |
|---|---|---|
| `npm run test:e2e:golden` | Local golden-path verification from a clean build | Chromium golden path |
| `npm run test:e2e:golden:ci` | CI-friendly golden-path execution after `verify:local` | Chromium golden path |
| `npm run test:e2e` | Full local regression run | All configured Playwright coverage |
| `npm run verify:dev` | Merge gate for `dev` | `verify:local` + Chromium golden path |
| `npm run verify:preview` | Release-candidate validation (`pull_request` into `main`) | `verify:local` + full Playwright suite |
| `npm run verify:prod` | Production verification (`push` to `main`) | `verify:local` + full Playwright suite |

## Triage Priority

When CI fails:

1. Fix golden-path deterministic failures first.
2. Review whether the failure belongs in the dev gate at all.
3. If the issue is environment-specific, move it to extended coverage or document the skip policy.
4. Only expand the golden-path matrix when the new journey is stable enough to provide clean release signal.

## Current Gaps

- `tests/e2e/reliability.spec.ts` exists, but authenticated execution still depends on live E2E credentials.
- Authenticated mobile coverage remains intentionally non-blocking.
- Some preview-only flows still require human validation even when automated coverage exists.