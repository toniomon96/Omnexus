# Release Day Runbook

This is the operator playbook for shipping Omnexus from `dev` to `main` safely in one session.

Use with:
- `docs/RELEASE_CHECKLIST.md` for pass/fail criteria
- `docs/ENVIRONMENT_MATRIX.md` for expected values per environment
- `docs/CI_RUNBOOK.md` for troubleshooting failed gates

## Roles

- Release captain: drives checklist, owns go/no-go.
- QA owner: executes manual smoke.
- Ops owner: watches logs/alerts for 24h after deploy.
- Rollback owner: executes rollback if trigger conditions are hit.

## 0. Start conditions

- `dev` is up to date and green in GitHub Actions.
- No open Sev 1/Sev 2 issues for this release.
- Release PR notes are current.

## 1. Local + CI gate (must pass)

Run from repo root:

```bash
npm run verify:prod
npm audit --omit=dev
```

Expected:
- `verify:prod` exits `0`
- `npm audit --omit=dev` has no untriaged critical/high runtime vulnerabilities

Evidence to capture:
- terminal output snippet or CI link showing green

## 2. Environment and secret audit (Preview + Production)

In Vercel project settings, confirm both scopes have:
- `ASK_MODEL`
- `ASK_FALLBACK_MODEL`
- `ANTHROPIC_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Hard rule:
- No deprecated `*-latest` model aliases in deployed env values.

Evidence to capture:
- screenshot of env var names (values redacted)

## 3. Open release PR and verify preview

- Open or refresh PR: `dev -> main`
- Wait for preview deploy + required checks
- Confirm `Preview Release Gate` is green

Evidence to capture:
- PR URL
- preview URL
- checks screenshot

## 4. Manual preview smoke (10-15 min)

Use preview URL and run these paths:

- `/login`: wrong credentials shows actionable guidance
- `/guest` -> `/`: guest onboarding and dashboard
- `/ask`: stream response and loading state
- `/insights`: guest account CTA and no raw backend errors
- `/train` -> active workout -> finish/discard flow
- `/subscription`: checkout/portal redirects
- `/profile`: notification settings save

Pass condition:
- No blocker behavior, no raw stack traces, no broken navigation.

Evidence to capture:
- short QA note in PR with pass/fail per route

## 5. Production promotion

- Confirm required approvals on `dev -> main` PR
- Merge PR to `main`
- Watch Vercel production deployment until success

Evidence to capture:
- production deployment URL/status

## 6. First 30-minute production watch

Monitor for:
- Error spikes: `/api/ask`, `/api/briefing`, `/api/webhook-stripe`
- Notification routes: `/api/daily-reminder`, `/api/training-notifications`, `/api/weekly-digest`
- Auth/login anomalies
- Checkout/webhook anomalies

Go/no-go rollback trigger examples:
- sustained 5xx spike > 10% for 10 minutes on critical API
- auth/login broken for new sessions
- checkout or webhook failure affecting paid users

Evidence to capture:
- screenshot or notes from monitoring dashboards

## 7. Rollback procedure

1. Identify last known good commit on `main`.
2. Re-deploy that commit in Vercel production.
3. Post incident note in release PR with:
- trigger
- impact
- rollback time
- follow-up issue links

## 8. 24-hour follow-up

- Ops owner checks error trend and conversion/auth baselines.
- Confirm cron jobs ran as expected.
- Close release task with summary in PR.

## Quick command block

```bash
npm run verify:prod
npm audit --omit=dev
npm run test:e2e -- tests/e2e/auth.spec.ts --project=chromium
npm run test:e2e -- tests/e2e/insights.spec.ts --project=chromium
```
