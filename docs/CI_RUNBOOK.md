# CI Runbook

This runbook is for fast triage when GitHub Actions gates fail.

## Gate Commands

- Local gate: `npm run verify:local`
- Dev gate: `npm run verify:dev`
- Preview gate: `npm run verify:preview`
- Production gate: `npm run verify:prod`

## Quick Triage Order

1. Reproduce locally with the same gate command used in CI.
2. Check required secrets (`E2E_BASE_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`).
3. Confirm target URL is reachable and points to the expected environment.
4. Review Playwright artifacts in CI (`playwright-report/`, `test-results/`).
5. Fix deterministic issues first (selectors, test setup, auth/session assumptions).

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
- Reset state with shared helpers (for example `signOut` + `enterAsGuest`) before assertions.
- Wait for route and key UI anchors before asserting details.

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
3. Run full gate command (`verify:dev` or `verify:prod`).
4. Push only after full gate passes locally.
