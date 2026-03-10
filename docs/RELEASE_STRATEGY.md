# Release Strategy

This repo should promote changes through `local -> dev -> preview -> prod`.

## Environment model

| Stage | Branch source | Purpose | Required checks | Deployment target |
|---|---|---|---|---|
| Local | `feature/*`, `bug/*`, `fix/*`, `chore/*`, `docs/*`, `polish/*` | Individual development | `npm run verify:local` | `vercel dev` or local preview |
| Dev | `dev` | Shared integration branch | GitHub `Quality Gate` + `Dev Smoke Gate` | Dedicated DEV Vercel domain |
| Preview | PR `dev -> main` | Release candidate validation | GitHub `Quality Gate` + `Preview Release Gate` + manual QA | Vercel Preview deployment |
| Prod | `main` | Production | Only merged release or hotfix PRs | Vercel Production |

## Branching rules

- Branch feature, bug, fix, chore, docs, and polish work from `dev`.
- Merge day-to-day work into `dev`, never directly into `main`.
- Promote releases with a pull request from `dev` to `main`.
- Use `hotfix/*` from `main` only for urgent production issues, then back-merge into `dev`.

Examples:

```bash
git checkout dev
git pull
git checkout -b feature/program-builder-polish

git checkout dev
git pull
git checkout -b bug/stale-bottom-nav-content
```

## Verification commands

| Command | Purpose |
|---|---|
| `npm run verify:local` | Lint, typecheck, unit tests, and production build |
| `npm run verify:dev` | Local gate plus Chromium smoke E2E coverage for integration safety |
| `npm run verify:preview` | Local gate plus full Playwright suite for release candidates |

## CI policy

The GitHub Actions workflow enforces:

- `pull_request` branch naming rules before any other gate
- `pull_request` into `dev`: `Quality Gate` and `Dev Smoke Gate`
- `push` to `dev`: `Quality Gate` and `Dev Smoke Gate`
- `pull_request` into `main`: `Quality Gate` and `Preview Release Gate`
- `push` to `main`: `Quality Gate` and `Dev Smoke Gate`
- manual `Release Verification` runs for preview or production targets
- manual `Promote dev to main` creates or refreshes the release PR

Recommended GitHub branch protection:

- Protect `dev` and `main`
- Require pull requests before merging
- Require approvals on `main`
- Require status checks to pass before merging
- Disable force pushes and branch deletion for protected branches

## Vercel policy

Configure Vercel so the repo environments match the branch flow:

1. Production branch: `main`
2. DEV branch/domain: `dev` mapped to a stable internal URL such as `dev.omnexus.fit`
3. Preview deployments: every PR, especially the `dev -> main` release PR
4. Separate environment-variable scopes for Development, Preview, and Production

Important Vercel nuance:

- Vercel `Development` variables are primarily for local `vercel dev`
- A hosted `dev` branch deployment normally uses `Preview` variables unless you set up branch-specific overrides or custom environments
- A custom DEV domain in Vercel is normally attached as a `Preview` domain
- The simplest safe setup is to treat hosted `dev` as `Preview` in Vercel, while still treating it as the repo's DEV stage

Recommended environment ownership:

- Development: safe test keys, DEV Supabase project if available
- Preview: production-like config with isolated third-party resources where possible
- Production: real production secrets only

## Release checklist

1. Merge validated feature and bug branches into `dev`
2. Confirm `dev` is green in GitHub Actions
3. Perform exploratory QA in the DEV environment
4. Run `Promote dev to main` or open a `dev -> main` PR manually
5. Review the Vercel preview deployment
6. Confirm `Preview Release Gate` is green
7. Complete manual release QA on preview
8. Merge to `main`
9. Confirm Vercel production deployment is healthy
10. If a production issue is found, ship `hotfix/*` from `main` and then back-merge the fix into `dev`

## Automation path

To automate the version-control promotion step:

1. In GitHub Actions, select the `dev` branch in the "Run workflow" branch selector (or use `gh workflow run "<workflow name>" --ref dev`).
2. Run the `Promote dev to main` GitHub Actions workflow
3. Review the created or updated release PR
4. Let Vercel create the Preview deployment from that PR
5. Merge when Preview is approved

## Minimum standard for production safety

Production should only receive code that has:

- passed `npm run verify:local`
- passed the CI gates for the target branch
- been exercised in a Preview deployment
- received human approval before merging to `main`

## What still requires manual admin access

The repository automation is already in place. The remaining work is platform configuration in GitHub, Vercel, Supabase, and Stripe.

Use `docs/PLATFORM_SETUP_CHECKLIST.md` as the step-by-step setup guide.