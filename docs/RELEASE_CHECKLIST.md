# Release Checklist

Use this checklist whenever Omnexus is promoted from `dev` to `main`.

## 1. Local readiness

- [ ] Changes are already merged into `dev`
- [ ] `npm run verify:local` passes on the release candidate branch
- [ ] Release notes / PR summary are current
- [ ] No known Sev 1 or Sev 2 bugs are open for this release

## 2. DEV readiness

- [ ] `dev` is green in GitHub Actions
- [ ] `Dev Smoke Gate` passed
- [ ] Shared DEV deployment is healthy
- [ ] Exploratory testing in DEV is complete for changed surfaces

## 3. Preview candidate

- [ ] A `dev -> main` PR is open
- [ ] Vercel Preview deployment is available
- [ ] `Preview Release Gate` passed
- [ ] Preview environment variables are correct
- [ ] Supabase auth redirects work in Preview
- [ ] Stripe redirects work in Preview

## 4. Manual QA on Preview

- [ ] Login flow works
- [ ] Guest flow works
- [ ] Dashboard loads and hydrates correctly
- [ ] Bottom navigation works across core tabs
- [ ] Workout start / finish / history works
- [ ] Learn page and course flow works
- [ ] Nutrition and profile flows work
- [ ] Any release-specific feature or fix is validated manually

## 5. Production promotion

- [ ] Required approvals are present on the `dev -> main` PR
- [ ] `main` required checks are green
- [ ] Merge to `main`
- [ ] Vercel Production deployment completes successfully

## 6. Post-release verification

- [ ] Production app loads successfully
- [ ] Auth works in Production
- [ ] Critical pages load: dashboard, train, learn, insights
- [ ] No new errors appear in logs/monitoring
- [ ] Stakeholders are notified if needed

## 7. Rollback readiness

- [ ] Previous stable production commit is known
- [ ] Rollback owner is clear
- [ ] Rollback path is documented in the release PR