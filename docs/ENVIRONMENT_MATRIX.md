# Environment Matrix

This matrix defines how Omnexus should differ across Local, DEV, Preview, and Prod.

| Area | Local | DEV | Preview | Prod |
|---|---|---|---|---|
| Git source | `feature/*`, `bug/*`, `fix/*`, `chore/*`, `docs/*`, `polish/*` | `dev` | `dev -> main` PR / preview deploy | `main` |
| Purpose | individual development | shared integration | release candidate validation | customer-facing stable release |
| Deploy target | `vercel dev` or local preview | stable DEV deployment | Vercel Preview deployment | Vercel Production |
| Verification command | `npm run verify:local` | `npm run verify:dev` | `npm run verify:preview` | post-deploy smoke + monitoring |
| Approval needed | no | PR review to `dev` | release PR approval | protected `main` merge |

## Required environment-specific values

| Variable | Local | DEV | Preview | Prod |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | local/test | DEV | preview | prod |
| `APP_URL` | `http://localhost:3000` | DEV URL | Preview URL | production URL |
| `ALLOWED_ORIGIN` | localhost origin | DEV origin | preview origin | production origin |
| `CRON_SECRET` | optional | set if cron jobs run | set if cron jobs run | required for production cron jobs |
| `OPENAI_API_KEY` | local/test | DEV | preview | prod |
| `SEED_SECRET` | local secret | DEV secret | preview secret | prod secret |
| `VITE_API_BASE_URL` | local URL or unset | DEV API URL | preview API URL | production API URL |
| `VITE_SITE_URL` | `http://localhost:3000` | DEV URL | Preview URL | production URL |
| `VITE_SUPABASE_URL` | local/dev project URL | DEV project URL | preview or production-like URL | production URL |
| `VITE_SUPABASE_ANON_KEY` | local/dev anon key | DEV anon key | preview anon key | prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | local/dev service key | DEV service key | preview service key | prod service key |
| `STRIPE_SECRET_KEY` | test | test | test | live |
| `STRIPE_WEBHOOK_SECRET` | local/test | DEV/test | preview/test | production/live |
| `RESEND_API_KEY` | sandbox/test | DEV | preview-safe | production |
| `VITE_POSTHOG_KEY` | optional | DEV | preview | prod |
| `VAPID_*` | local/test | DEV | preview | prod |
| `UPSTASH_*` | optional | DEV | preview | prod |

## Environment rules

- Local must be safe for frequent iteration.
- DEV must be stable enough for teammate testing.
- Preview must be production-like enough to catch release bugs.
- Prod must only use production secrets and the `main` branch.

## Recommended platform mapping

- Vercel Development: local `vercel dev` and local env pulls
- Vercel Preview: hosted `dev` branch deployment plus all PR previews
- Vercel Production: `main` only

## Important Vercel nuance

- Vercel environment scopes do not automatically map `dev` branch to `Development`
- Unless you create custom environments, a hosted `dev` branch deploy is a `Preview` deployment
- In the Domains UI, custom DEV hostnames are assigned as `Preview`, not `Development`
- The simplest working setup is:
	- `Development` vars for local work
	- `Preview` vars for hosted `dev` and PR previews
	- `Production` vars for `main`

## External service notes

- Supabase redirect URLs should include local, DEV, Preview, and Prod URLs.
- Stripe should use test mode for Local, DEV, and Preview; live mode only for Prod.
- Email providers should avoid sending real customer mail from Local or Preview unless intentional.