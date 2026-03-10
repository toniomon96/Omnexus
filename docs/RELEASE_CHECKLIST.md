# Release Checklist

Use this checklist whenever Omnexus is promoted from `dev` to `main`.

Execution guide: see `docs/RELEASE_DAY.md` for step-by-step release-day operations.
Security ops tracker: see `docs/PLATFORM_SECURITY_OPS.md`.

## 1. Local readiness

- [ ] Changes are already merged into `dev`
- [ ] `npm run verify:local` passes on the release candidate branch
- [ ] `npm run verify:prod` passes locally or on CI against preview-like env
- [ ] Release notes / PR summary are current
- [ ] No known Sev 1 or Sev 2 bugs are open for this release

## 2. Environment and secret audit

- [ ] Preview and Production env vars are present and match `docs/ENVIRONMENT_MATRIX.md`
- [ ] Claude model vars are explicit and non-deprecated:
	- [ ] `ASK_MODEL` is set
	- [ ] `ASK_FALLBACK_MODEL` is set
	- [ ] No `*-latest` aliases are used in deployed env values
- [ ] Core secrets are present per environment:
	- [ ] `ANTHROPIC_API_KEY`
	- [ ] `VITE_SUPABASE_URL`
	- [ ] `VITE_SUPABASE_ANON_KEY`
	- [ ] `SUPABASE_SERVICE_ROLE_KEY`
	- [ ] `CRON_SECRET`
	- [ ] `STRIPE_SECRET_KEY`
	- [ ] `STRIPE_WEBHOOK_SECRET`
	- [ ] `VITE_VAPID_PUBLIC_KEY`
	- [ ] `VAPID_PUBLIC_KEY`
	- [ ] `VAPID_PRIVATE_KEY`

## 3. DEV and Preview readiness

- [ ] `dev` is green in GitHub Actions
- [ ] DEV deployment is healthy
- [ ] A `dev -> main` PR is open
- [ ] Vercel Preview deployment is available and healthy
- [ ] `Preview Release Gate` passed
- [ ] Supabase auth redirects work in Preview
- [ ] Stripe redirects work in Preview

## 4. Manual smoke on Preview

- [ ] Login and sign out flows work
- [ ] Guest mode works and guest gating is consistent
- [ ] Dashboard and Today card load correctly
- [ ] Workout start, active session, finish, and history work
- [ ] Ask streaming works and degraded fallback messaging looks correct
- [ ] Insights load and follow-up behavior is correct for guest vs account users
- [ ] Learn and Nutrition flows work
- [ ] Subscription upgrade and customer portal redirects work

## 5. Monitoring and alerts

- [ ] API error monitoring is enabled for critical routes:
	- [ ] `/api/ask`
	- [ ] `/api/briefing`
	- [ ] `/api/webhook-stripe`
	- [ ] Notification routes (`/api/daily-reminder`, `/api/training-notifications`, `/api/weekly-digest`)
- [ ] Alert thresholds are configured (error rate, latency spike, webhook failures)
- [ ] Post-release log watch owner is assigned for first 24 hours

## 6. Database and rollback safety

- [ ] Latest migrations are applied in Preview and Production
- [ ] Pre-release backup/snapshot is taken
- [ ] Previous stable production commit SHA is recorded
- [ ] Rollback owner and rollback command/path are documented in the release PR

## 7. Security and abuse checks

- [ ] Public APIs have expected CORS behavior
- [ ] Public APIs enforce rate limiting where required
- [ ] Service-role credentials are not exposed in client artifacts
- [ ] `npm audit --omit=dev` reviewed; critical/high vulnerabilities are triaged

## 8. Performance and PWA checks

- [ ] Core pages load fast on mobile network profile (dashboard, workout, ask)
- [ ] PWA install prompt and installability are functioning
- [ ] Service worker update flow does not leave stale UI after deployment
- [ ] Safe-area and sticky headers/tabs are visually correct on iOS and Android sizes

## 9. Legal and trust basics

- [ ] Privacy Policy and Terms are accessible from app/landing
- [ ] Support contact and bug report flow work
- [ ] Data export and delete-account flows are validated in Preview

## 10. Production promotion and verification

- [ ] Required approvals are present on the `dev -> main` PR
- [ ] `main` required checks are green
- [ ] Merge to `main`
- [ ] Vercel Production deployment completes successfully
- [ ] Production smoke test passes for critical paths
- [ ] No new error spike in first 30 minutes after release