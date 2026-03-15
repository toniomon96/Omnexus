# Development Guide

## Local Setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with the client and server variables described below.
3. Run `vercel dev` for full-stack local development.
4. Use `npm run dev` only when you intentionally want the frontend without serverless functions.

## Environment Variables

### Client-visible (`VITE_*`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` (optional)
- `VITE_API_BASE_URL` (native builds)

### Server-only

- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `APP_URL`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- `ALLOWED_ORIGIN` / `ALLOWED_ORIGINS`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `SEED_SECRET`

See [`environment-matrix.md`](environment-matrix.md) for environment-specific expectations.

## Verification Commands

| Purpose | Command |
|---|---|
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Unit tests | `npm test -- --run` |
| Build | `npm run build` |
| Full local verification | `npm run verify:local` |
| Golden-path E2E | `npm run test:e2e:golden` |

## Deployment

- **Local → Dev → Preview → Prod** is the intended promotion flow.
- Vercel handles the frontend and serverless deployment.
- Stripe, Supabase, Resend, Upstash, and GitHub branch protection still require platform-side setup.
- Release expectations and signoff flow live in [`release-strategy.md`](release-strategy.md) and [`release-checklist.md`](release-checklist.md).

## Folder Structure

```text
src/
├── components/   Reusable UI and domain components
├── contexts/     Auth and toast providers
├── data/         Static course, program, and exercise content
├── hooks/        Route/component hooks
├── lib/          Data access, service wrappers, business logic
├── pages/        Route-level screens
├── services/     API client helpers
├── store/        Global reducer state
├── types/        Shared TypeScript types
└── utils/        Focused utility modules

api/             Vercel serverless handlers and shared route helpers
docs/            Product, engineering, roadmap, audit, and archive docs
tests/e2e/       Playwright coverage
```

## Current Engineering Watchouts

- The repo has good coverage, but several core files are very large and should be refactored carefully over time.
- `src/utils/localStorage.ts` is both statically and dynamically imported, which produces a Vite chunking warning during build.
- The legacy wiki mirror in `docs/wiki/` is stale and should not be treated as the source of truth.
