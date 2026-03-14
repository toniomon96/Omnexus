# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript 5.7, Tailwind CSS 4, React Router v7 |
| State | Context API + useReducer (`AppContext`), `ToastContext` |
| Backend | Vercel serverless functions (`api/` directory, Node 20) |
| AI | Anthropic Claude `claude-sonnet-4-6` (onboarding, Q&A, insights, program generation) |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) → pgvector RAG |
| Database | Supabase: PostgreSQL + pgvector + Realtime + Auth |
| Storage | Supabase Storage (`avatars` bucket) |
| Native | Capacitor v8 — iOS + Android |
| Payments | Stripe (checkout, webhooks, `$12.99/month` premium) |
| Email | Resend (branded confirmation + transactional emails) |
| Analytics | PostHog (HTTP capture wrapper, 8 tracked events) |
| Rate Limiting | Upstash Redis (sliding window: 20 req/10 min/IP) |
| Testing | Vitest (unit, 513 tests) + Playwright (E2E) |
| CI | GitHub Actions (lint + tsc + unit + E2E) |

---

## Key File Paths

| File | Purpose |
|---|---|
| `src/types/index.ts` | All TypeScript interfaces |
| `src/store/AppContext.tsx` | Global state + reducer |
| `src/contexts/AuthContext.tsx` | Supabase Auth (`useAuth` hook) |
| `src/contexts/ToastContext.tsx` | Toast notifications |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/db.ts` | Typed Supabase helpers (all writes throw on error) |
| `src/lib/api.ts` | `apiBase` — all fetches use this prefix (Capacitor compat) |
| `src/lib/analytics.ts` | PostHog wrapper (`track`, `identify`) |
| `src/router.tsx` | React Router config + auth guards |
| `src/data/exercises/index.ts` | 316 exercises (modular — barbell, dumbbell, cable, etc.) |
| `src/data/courses.ts` | 15 courses (Nutrition, Science, Technique, Mind) |
| `src/data/programs.ts` | Pre-built training programs |

> For the full architecture diagram and data models, see [docs/ARCHITECTURE.md](../ARCHITECTURE.md).

| `api/_rateLimit.ts` | Upstash rate limiting helper |
| `api/ask.ts` | AI coach endpoint (pgvector RAG + Claude) |
| `api/generate-program.ts` | 8-week mesocycle generation |
| `api/onboard.ts` | Onboarding conversation agent |
| `api/signup.ts` | Server-side user creation (Resend branded email) |
| `api/setup-profile.ts` | Profile row creation in Supabase |

---

## Data Models

### User
```typescript
{ id, name, goal, experienceLevel, activeProgramId?, onboardedAt, theme, isGuest?, avatarUrl? }
```

### Program
```typescript
{ id, name, goal, experienceLevel, daysPerWeek, estimatedDurationWeeks, schedule,
  isCustom?, isAiGenerated?, createdAt?, weeklyProgressionNotes?, trainingPhilosophy? }
```

### UserTrainingProfile
```typescript
{ goals, trainingAgeYears, daysPerWeek, sessionDurationMinutes, equipment, injuries,
  aiSummary, priorityMuscles?, programStyle?, includeCardio? }
```

---

## Onboarding Flow

```
Step 0: Account (email + password)
Step 1: Name
Step 2: AI Chat (9 data points collected by Claude)
Step 3: Profile summary → click "Generate My Program"
         ↓ parallel
         [/api/signup]         [/api/generate-program]
         (fast ~1s)            (slow ~30-60s)
         ↓                     ↓
Step 4: WelcomeTutorial (4 slides × 7s while both run)
         ↓ both resolve
Step 5: /api/setup-profile (with activeProgramId)
         ↓
App dashboard (/)
```

---

## Auth Guards

| Guard | Access |
|---|---|
| `GuestOrAuthGuard` | Supabase session OR localStorage guest profile |
| `AuthOnlyGuard` | Supabase session required (community features) |
| `OnboardingGuard` | Redirect to `/` if already onboarded |
| `LoginGuard` | Redirect to `/` if already signed in |

---

## Environment Variables

### Client (VITE_ prefix)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (native builds only)
- `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`

### Server (Vercel env vars)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEED_SECRET`, `ALLOWED_ORIGIN`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### E2E Testing (.env.test)
- `E2E_BASE_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`
