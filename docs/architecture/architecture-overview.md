# Architecture Overview

## Frontend Architecture

### Application Shell

- `src/App.tsx` composes the global providers and wraps the router with a top-level `ErrorBoundary`.
- `src/router.tsx` is the route map and main guard layer. It lazy-loads most page modules, keeps auth-critical pages eager, and handles guest/auth hydration.
- `src/pages/` contains route-level screens; most business logic then fans into `components/`, `hooks/`, `lib/`, and `utils/`.

### State Management

- **`AuthContext`** manages the Supabase session lifecycle.
- **`AppContext`** is the global reducer for user state, workout history, active session, learning progress, and gamification.
- **`ToastContext`** handles ephemeral UI feedback.
- **Local persistence** is centralized in `src/utils/localStorage.ts`, but many pages still depend on it directly, which increases coupling between local and server-backed flows.

### Data Access

- `src/lib/db.ts` is the typed Supabase data access layer.
- `src/lib/dbHydration.ts` and route guards hydrate user-scoped state after sign-in.
- `src/lib/api.ts` abstracts the API base so the same frontend can run on web and Capacitor.
- Static domain content lives in `src/data/`, with the course catalog and exercise library compiled into the client bundle.

## Serverless API Architecture

### Route Structure

- `api/` contains Vercel Node handlers grouped implicitly by concern: AI, auth/account flows, billing, notifications, content, and utilities.
- Shared route helpers live beside handlers as `_cors.ts`, `_rateLimit.ts`, `_aiSafety.ts`, `_stripe.ts`, `_cache.ts`, and related modules.
- Route tests live next to handlers, giving the backend surface good localized coverage.

### Request Pattern

1. Apply CORS and security headers.
2. Reject unsupported methods.
3. Apply rate limiting when the route is externally reachable.
4. Validate auth and request body.
5. Call provider or Supabase logic.
6. Return structured JSON and degrade safely when possible.

## AI Integration Architecture

### Providers

- **Anthropic** powers Ask Omnexus, onboarding, insights, program generation, adaptation, briefing, progression reporting, missions, and lesson/content generation.
- **OpenAI embeddings** support semantic search and recommendation workflows through pgvector.
- **PubMed** supplies source material for research features and citations.

### Safety and Fallbacks

- `_aiSafety.ts` sanitizes free text and rejects prompt-injection-like input patterns.
- Several AI flows have deterministic fallbacks, notably program generation and degraded UI states on the client.
- AI features are isolated behind serverless routes, so browser code never sees provider secrets.

## Data Flow

### Typical Signed-In Flow

1. User authenticates with Supabase.
2. Route guard hydrates profile and user data.
3. UI reads state from context and localStorage-backed caches.
4. Mutations go through typed helpers or `/api/*` routes.
5. Supabase persists canonical records; localStorage may retain guest or cached slices.

### Guest Flow

1. Guest profile is created locally.
2. Training, learning, and some gamification state stay in localStorage.
3. When a guest signs up, migration helpers import eligible local data into Supabase.

## Error Handling and Stability

- UI-level failures are caught by `ErrorBoundary` and `RouterErrorBoundary`.
- User-facing async failures generally become toasts or degraded cards.
- Backend handlers use defensive `try/catch` blocks and return explicit 4xx/5xx responses.
- The largest stability risk is not missing guards, but the amount of business logic concentrated in very large files such as `src/lib/db.ts`, `src/router.tsx`, and several route/page modules.

## Security Patterns

- Strict production/preview origin validation in `api/_cors.ts`.
- IP-based rate limiting via Upstash with a production fail-closed posture in `api/_rateLimit.ts`.
- Supabase RLS plus service-role usage restricted to admin-style server workflows.
- Secrets are loaded from server environment variables; browser usage stays on `VITE_*` values.
- Request validation exists in most backend flows, but consistency varies by route and large AI endpoints remain the highest-risk area for future regressions.

## Build and Delivery

- Frontend build: `npm run build` (`tsc -b && vite build`).
- Lint: `npm run lint`.
- Unit tests: `npm test -- --run`.
- E2E tests: Playwright commands in `package.json`.
- Deployment and release process are documented under `docs/engineering/`.
