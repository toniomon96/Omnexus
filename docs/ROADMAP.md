# Omnexus — Product Roadmap

> Living document. Updated as sprints complete. Dates are approximate.

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Shipped |
| 🚧 | In progress |
| 📋 | Planned — spec written |
| 💡 | Idea — not yet scoped |

---

## Completed

### Foundation (Phases 1–8)

| Phase | Delivered | Key Files |
|---|---|---|
| 1 | Rebrand + Navigation (Omnexus branding, 5-tab nav) | `src/router.tsx` |
| 2 | Learning System (courses, quizzes, progress tracking, Supabase sync) | `src/pages/LearnPage.tsx`, `src/pages/LessonPage.tsx` |
| 3 | Vercel Setup + Serverless scaffolding | `api/`, `vercel.json` |
| 4 | Ask Omnexus (Claude Q&A, markdown render, history) | `api/ask.ts`, `src/pages/AskPage.tsx` |
| 5 | AI Insights (workout analysis, InsightsPage) | `api/insights.ts`, `src/pages/InsightsPage.tsx` |
| 6 | Health Articles (PubMed feed, 7 categories, 6h cache) | `api/articles.ts`, `src/services/pubmedService.ts` |
| 7 | Personalization (course scoring by goal + level) | `src/services/learningService.ts` |
| 8 | Training Depth (RPE input, 1RM progression chart, custom program builder, CI) | `src/pages/ProgramBuilderPage.tsx` |

### Production Readiness

| Sprint | Delivered | Key Files |
|---|---|---|
| Prod 2 | Supabase Auth (email+password, multi-device sync, migration) | `src/contexts/AuthContext.tsx`, `src/lib/db.ts` |
| Prod 3 | Cloud Data Sync (Supabase source of truth, localStorage cache) | `src/components/auth/AuthGuard.tsx` |
| Prod 5 | Community (friends, leaderboard, challenges, real-time activity feed + reactions) | `src/pages/FriendsPage.tsx`, `src/pages/ChallengesPage.tsx` |
| Prod 6 | GDPR (cookie consent, privacy policy, data export, account deletion) | `api/export-data.ts`, `api/delete-account.ts` |

### Enhancement Phases

| Sprint | Delivered | Key Files |
|---|---|---|
| Expansion A | PR celebration (confetti), weekly recap card, muscle heat map, enhanced streak | `src/components/dashboard/` |
| Expansion B | Guest mode, shareable PNG cards, TodayCard, plate calculator | `src/pages/GuestSetupPage.tsx` |
| Expansion C | Push notifications (VAPID, service worker, daily cron, friend alerts) | `public/sw.js`, `api/notify-friends.ts` |
| Expansion D | Nutrition tracking (macro logging, goals, date navigator) | `src/pages/NutritionPage.tsx` |
| E1 | Toast system + Supabase write error propagation everywhere | `src/contexts/ToastContext.tsx` |
| E2 | Performance (debounced learning sync, React.memo, memoized lists) | `src/store/AppContext.tsx` |
| E3 | Mobile UX (5-tab nav, RPE tap-buttons, ConfirmDialog) | `src/components/ui/ConfirmDialog.tsx` |
| E4 | Visual polish (skeleton loaders, SVG ring, gradient cards, quiz animation) | `src/components/ui/Skeleton.tsx` |
| E5 | Test coverage (28 Vitest unit tests, ESLint/TSC clean) | `src/tests/` |
| Capacitor | iOS + Android packaging (v8): status bar, splash, haptics, safe areas, `apiBase` abstraction | `capacitor.config.ts`, `src/lib/api.ts` |

### AI / Intelligence Phases

| Sprint | Delivered | Key Files |
|---|---|---|
| Phase 1 AI | AI Onboarding Agent (multi-turn Claude chat), Generative Mesocycle Engine (8-week program JSON), Exercise MovementPattern tags | `api/onboard.ts`, `api/generate-program.ts` |
| Phase 2 Learning | Supabase pgvector (exercise + content embeddings), semantic content search, dynamic micro-lesson generation | `api/recommend-content.ts`, `api/generate-lesson.ts`, `api/seed-embeddings.ts` |
| Phase 3 Intelligence | Adaptation Engine (`/api/adapt`), Block Missions (`/api/generate-missions`), AI Challenges (personal + shared cron), Peer Insights (`/api/peer-insights`) | `api/adapt.ts`, `api/generate-missions.ts` |
| Phase 6 Workout Quality | Extended UserTrainingProfile (priorityMuscles, programStyle, includeCardio), extended Program (weeklyProgressionNotes, trainingPhilosophy), /api/generate-program complete rewrite (periodization, volume landmarks, injury rules), 8 new exercises → 51 total | `api/generate-program.ts`, `src/data/exercises.ts` |

### Security & Testing

| Sprint | Delivered | Key Files |
|---|---|---|
| Phase 7 Security | Optional activeProgramId (TS fix), Upstash rate limiting (20 req/10 min/IP), CORS production warnings, userContext whitelist injection guard, setup-profile FK handling, fetchHistory error propagation, Playwright E2E suite | `api/_rateLimit.ts`, `api/_cors.ts`, `tests/e2e/` |

### Recent Sprints

| Sprint | Delivered | Supabase migrations required |
|---|---|---|
| Sprint 4 | Nutrition Quick Log (date navigator, macro logs, quick-add meals, goals modal), Streak polish | None |
| Sprint 5 | Source-Grounded AI Coach: OpenAI pgvector RAG in `/api/ask` (embed → `match_content`/`match_exercises` → CONTEXT SOURCES block), Citation type + display in AskPage | None (uses existing pgvector tables) |
| Sprint 6 | Social/Cooperative Competition: per-challenge leaderboard (lazy-loaded on first expand, gold/silver/bronze ranks), cooperative team mode (purple team progress bar + contributor caption), friend challenge invitations (FriendPicker, Realtime INSERT channel, accept/decline banner) | `ALTER TABLE challenges ADD COLUMN is_cooperative` + `CREATE TABLE challenge_invitations` |

---

## Upcoming

### Sprint 7 — Wearables MVP 📋

**Goal:** Surface Apple Health / Google Fit step counts and active calories inside the app on native builds (iOS/Android). Web users see a "native only" placeholder.

**Scope:**
- Install `@capacitor-community/health` plugin
- Read from Health store: steps today, active energy today, last 7 days steps
- New `HealthWidget` component on Dashboard (collapsible card, only shown on native)
- Permission request flow (requestPermission on first mount)
- Store raw reads in state; no Supabase persistence for MVP
- `src/lib/health.ts` — typed wrapper around the Capacitor Health plugin (no-op on web)

**Non-goals:** Writing workouts to Health, historical sync, third-party wearables (Garmin, Fitbit)

**Prerequisites:** Requires `cap:sync` after install; iOS needs HealthKit entitlement in Xcode.

---

### Sprint 8 — Analytics Instrumentation 📋

**Goal:** Instrument key user actions with PostHog to understand feature adoption, funnel drop-off, and engagement trends. Zero PII sent.

**Events to track:**
- `workout_completed` (duration, volume, program_id)
- `lesson_completed` (course_id, module_id, score)
- `challenge_joined` (challenge_id, type, is_cooperative)
- `ask_submitted` (has_rag_context: bool)
- `program_activated` (is_ai_generated: bool)
- `invitation_accepted` / `invitation_declined`

**Scope:**
- Install `posthog-js`
- `src/lib/analytics.ts` — thin wrapper: `track(event, props)`, no-op when `VITE_POSTHOG_KEY` is unset (safe for local dev)
- Call `track()` at 6–8 key action sites
- PostHog dashboard: set up funnels (onboarding → program activation, challenge create → invite → join)

**Privacy:** Events contain no names, emails, or user-identifiable content. Only anonymized IDs and action metadata.

---

### Sprint 9 — Advanced Program Progression 💡

- Progressive overload automation: auto-suggest next session targets in the workout UI (pulls from AdaptationResult)
- Week-by-week program view (expand any week to see planned vs. actual volume)
- Deload week detection (volume auto-drops when 3 sessions show RPE ≥ 9)

---

### Sprint 10 — Premium Tier 🚧

- Stripe integration for monthly subscription
- Gated features: unlimited AI insights, priority AI response (2000 tokens vs 1024)
- Free tier: 5 AI Q&A/day, 1 AI program generation, community access
- PDF program export deferred to Sprint 11

#### Sprint 10 required env vars
```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID (server)
VITE_STRIPE_PUBLISHABLE_KEY, VITE_APP_URL (client)
```
See `docs/setup-procedures.md` Section 6 for full setup instructions.

#### Sprint 10 Supabase SQL migrations
```sql
ALTER TABLE profiles ADD COLUMN stripe_customer_id text UNIQUE;

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  ask_count int NOT NULL DEFAULT 0,
  program_gen_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can view own usage" ON user_ai_usage FOR SELECT USING (auth.uid() = user_id);
```

---

## Technical Debt

| Item | Priority | Notes |
|---|---|---|
| ~~Delete account doesn't clean `challenge_invitations`~~ | ✅ Resolved | Fixed in Sprint 10 — `challenge_invitations`, `subscriptions`, `user_ai_usage` all cleaned |
| `getFriendFeed` two-step fallback pattern | Low | PostgREST FK join would be cleaner; blocked on Supabase FK declarations |
| `omnexus_last_adaptation` localStorage key not cleared on sign-out | Low | Minor: shows stale data to next user on same device |
| ~~Playwright E2E tests skip auth-required pages~~ | ✅ Resolved | `tests/e2e/community.spec.ts` added — Feed/Friends/Leaderboard covered |
| ~~Rate limiting on `/api/adapt` and `/api/insights`~~ | ✅ Resolved | Both endpoints have rate limiting applied |

---

## Deployment Checklist

When shipping a new sprint to production:

1. **Merge PR** — CI must pass (lint + tsc + unit tests)
2. **Supabase migrations** — run any SQL in Supabase SQL editor (production project)
3. **Environment variables** — set any new `VITE_*` or server env vars in Vercel dashboard
4. **`cap:sync`** — if Capacitor plugins were added/updated
5. **`vercel --prod`** or push to `main` — Vercel auto-deploys
6. **Smoke test** — sign in, complete a workout, check AI features respond correctly

### Sprint 6 migration (run in order)

```sql
-- Step 1: add cooperative column
ALTER TABLE challenges
  ADD COLUMN is_cooperative boolean NOT NULL DEFAULT false;

-- Step 2: create challenge_invitations table
CREATE TABLE challenge_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES profiles(id),
  to_user_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, to_user_id)
);
ALTER TABLE challenge_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inviter can insert"   ON challenge_invitations FOR INSERT  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "parties can view"     ON challenge_invitations FOR SELECT  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "recipient can update" ON challenge_invitations FOR UPDATE  USING (auth.uid() = to_user_id) WITH CHECK (auth.uid() = to_user_id);
CREATE POLICY "inviter can delete"   ON challenge_invitations FOR DELETE  USING (auth.uid() = from_user_id AND status = 'pending');
```
