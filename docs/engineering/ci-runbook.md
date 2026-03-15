# CI Runbook

This runbook is for fast triage when GitHub Actions gates fail.

## Gate Commands

- Local gate: `npm run verify:local`
- Smoke gate: `npm run verify:smoke`
- Dev gate: `npm run verify:dev`
- Preview gate: `npm run verify:preview`
- Production gate: `npm run verify:prod`

Golden-path references:

- Golden-path local run: `npm run test:e2e:golden`
- Golden-path CI run: `npm run test:e2e:golden:ci`
- Matrix definition: [E2E test matrix](E2E_TEST_MATRIX.md)

`verify:*` commands enforce unit test coverage thresholds via `npm run test:coverage`.

## Release Signal Model

- `verify:dev` is the deterministic Chromium golden-path gate.
- `verify:preview` is used for `pull_request` into `main` as the preview release-candidate gate.
- `verify:prod` is used for `push` to `main` as the production verification gate.
- Authenticated mobile flows and other environment-constrained paths should not be treated as primary `dev` gate signal.

## Quick Triage Order

1. Reproduce locally with the same gate command used in CI.
2. Check required secrets (`E2E_BASE_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`).
3. Confirm target URL is reachable and points to the expected environment.
4. Review Playwright artifacts in CI (`playwright-report/`, `test-results/`).
5. Fix deterministic issues first (selectors, test setup, auth/session assumptions).

If the failure is outside the golden-path matrix, decide whether it belongs in `dev` gate signal or should remain preview-only or manually validated coverage.

## Required Secrets

- `E2E_BASE_URL`: Base URL for E2E target environment.
- `E2E_TEST_EMAIL`: Dedicated auth test account.
- `E2E_TEST_PASSWORD`: Password for that test account.

If auth tests unexpectedly skip or fail login flows, verify secrets first.

## Common Failure Patterns

### 1) Lint or Typecheck failures

- Run:
  - `npm run lint`
  - `npm run typecheck`
- Fix the reported file/line issues, then rerun `npm run verify:local`.

### 2) Unit test failures

- Run `npm run test`.
- Use focused test execution while iterating, then rerun full test suite.

### 3) E2E fails with "element not found"

Typical causes:
- Brittle text selector tied to copy changes.
- LocalStorage mutations applied after app state hydration.
- Test not starting from a clean auth/guest state.

Fix patterns:
- Prefer role-based selectors over exact free text when possible.
- Reset state with shared helpers and deterministic storage seeding before assertions.
- Wait for route and key UI anchors before asserting details.

Golden-path guidance:

- Keep the `dev` gate focused on deterministic Chromium coverage.
- Move environment-sensitive flows out of the merge gate before expanding retries or timeouts.
- Treat `tests/e2e/reliability.spec.ts` and authenticated mobile paths as extended coverage until they are consistently green in CI.

### 4) Password reset flow issues

Symptoms:
- Reset email not received.
- Recovery link flow not reaching reset screen.

Checks:
- Supabase redirect URLs include all active environments with `/auth/callback`.
- Supabase email provider/sender config is valid.
- Spam/Junk filtering and delivery delay.
- Correct email entered in forgot-password form.

## Artifact-First Debugging

When CI fails E2E, download and inspect:

- `playwright-report/`
- `test-results/`
- failure screenshots and `error-context.md`

These usually identify selector mismatch, unexpected route, or auth state mismatch in minutes.

## Safe Re-Run Strategy

1. Run targeted failing spec locally.
2. Run related suite (for example `tests/e2e/workout.spec.ts`).
3. Run the appropriate gate command:
  - `verify:dev` for golden-path confidence
  - `verify:preview` or `verify:prod` for broader release validation
4. Push only after full gate passes locally.
