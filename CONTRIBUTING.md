# Contributing to Omnexus

Thank you for your interest in contributing. Here's everything you need to get started.

---

## Development Setup

See the [README](README.md#local-development) for full setup instructions.

Quick start:

```bash
npm install
# create .env.local with required keys
vercel dev        # starts frontend + serverless functions on :3000
```

---

## Branching Strategy

Use a promotion flow of `local -> dev -> preview -> prod`.

- `dev` is the shared integration branch.
- `main` is production only.
- Direct pushes to `dev` and `main` should be blocked; all changes go through PRs.
- Feature and bug work should land in `dev` first.
- Production releases should happen through a `dev -> main` PR after preview validation.

### Branch naming

| Prefix | Use for |
|---|---|
| `feature/` | New features |
| `bug/` | User-facing defects or regressions |
| `fix/` | Bug fixes |
| `chore/` | Dependencies, config, scripts |
| `docs/` | Documentation only |
| `hotfix/` | Urgent production patches |

Examples:
```bash
git checkout -b feature/form-coach-mediapipe
git checkout -b bug/learn-tab-regression
git checkout -b fix/offline-sync-conflict
git checkout -b chore/bump-capacitor-v9
git checkout -b docs/update-roadmap
```

### Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add MediaPipe pose estimation to AI form coach
fix: resolve offline sync conflict on duplicate set logs
chore: bump capacitor to v9
docs: update ROADMAP with v3 B2B section
test: add E2E spec for nutrition quick log
```

### PR workflow

1. Create your branch from `dev` for normal feature or bug work
2. Make your changes; commit often with descriptive messages
3. Run the local gate: `npm run verify:local`
4. Open a PR into `dev`; CI runs the dev smoke gate
5. After enough changes accumulate, open a `dev -> main` release PR
6. Review the Vercel preview deployment and require the preview release gate to pass
7. Merge into `main` only after preview signoff and required approvals

```bash
git checkout dev
git pull
git checkout -b feature/your-feature
git push -u origin feature/your-feature
gh pr create --base dev --fill
```

### Release promotion

1. `feature/*`, `bug/*`, `fix/*`, `chore/*`, `docs/*` branches merge into `dev`
2. `dev` auto-deploys to the shared DEV environment
3. A `dev -> main` PR creates the Preview release candidate and runs the full preview gate
4. `main` deploys to Prod only after the preview PR is approved and green

### Hotfixes

Branch from `main`, fix, PR back to `main` with fast-track review, then back-merge into `dev`:
```bash
git checkout -b hotfix/fix-broken-api main
# ... fix ...
git push -u origin hotfix/fix-broken-api
gh pr create --base main --label hotfix
```

---

## Making Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run the checks:
   ```bash
   npm run verify:local      # Local gate before opening any PR
   npm run verify:dev        # Expected for PRs targeting dev
   npm run verify:preview    # Expected for release PRs targeting main
   ```
4. Open a pull request against `dev` unless you are promoting a release or shipping a hotfix

### Required platform settings

- Protect `dev` and `main` in GitHub
- Require PRs before merging
- Require the `Quality Gate` and `Dev Smoke Gate` checks on `dev`
- Require the `Quality Gate` and `Preview Release Gate` checks on `main`
- Restrict production deployments in Vercel to the `main` branch
- Assign the `dev` branch to a dedicated DEV domain in Vercel
- Review every Preview deployment before merging to `main`

---

## Code Conventions

- **Components**: function declarations, not arrow functions assigned to `const`
- **Types**: centralized in `src/types/index.ts`
- **Static data**: goes in `src/data/`
- **Utilities**: grouped by domain in `src/utils/`
- **Supabase write helpers** in `db.ts` throw `Error('[fnName] ${error.message}')` — callers catch and use `toast()`
- **API endpoints**: always call `setCorsHeaders()` and `checkRateLimit()` at the top; never expose API keys in responses

---

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) or submit through the in-app Help page.

---

## Requesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Check [ROADMAP.md](docs/ROADMAP.md) first — it may already be planned.
