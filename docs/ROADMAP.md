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

## Recent Sprints (Completed)

| Sprint | Delivered | Key Files |
|---|---|---|
| Sprint 7 | Wearables MVP: `src/lib/health.ts` (Capacitor Health bridge, no-op on web), `HealthWidget.tsx` (steps + active cals + 7-day bar chart). **Note: `@capacitor-community/health` plugin install + iOS HealthKit entitlement deferred to v1.1 — NOT included in v1.0 store submission** | `src/lib/health.ts`, `src/components/dashboard/HealthWidget.tsx` |
| Sprint 8 | Analytics: PostHog HTTP wrapper (`src/lib/analytics.ts`), 8 tracked events (workout_completed, lesson_completed, challenge_joined/created, ask_submitted, program_activated, invitation_responded). No-op when VITE_POSTHOG_KEY unset | `src/lib/analytics.ts` |
| Sprint 9 | Profile Picture (Supabase Storage avatars bucket, camera overlay, 5MB validation), Light Mode Polish (24 files fixed — hardcoded dark classes → dark: pairs), Exercise Demos (YouTubeEmbed lazy thumbnail→iframe, 45 YouTube IDs, play button → bottom-sheet modal) | `src/components/ui/Avatar.tsx`, `src/components/ui/YouTubeEmbed.tsx`, `src/data/exercises.ts` |
| Sprint 10 | Premium Tier: Stripe checkout + customer portal + webhook handler, usage gating (5 asks/day free, 1 program gen/day free, 2000 tokens premium vs 1024 free), SubscriptionPage, useSubscription hook, AskPage usage badge + inline upgrade card, ProfilePage subscription section | `api/create-checkout.ts`, `api/webhook-stripe.ts`, `src/pages/SubscriptionPage.tsx`, `src/hooks/useSubscription.ts` |
| Sprint 11 | UX Overhaul + Marketing Site: Redesigned 5-tab nav (Home · Train · Community · Learn · Me), TrainPage hub, CommunityPage hub, cleaned Dashboard (removed clutter, added AI insights teaser), HelpPage (FAQ accordion + in-app bug report form → Supabase), `/api/report-bug` endpoint, ProfilePage Help entry, standalone `landing/index.html` marketing site (no build needed, drag-to-Netlify) | `src/components/layout/BottomNav.tsx`, `src/pages/TrainPage.tsx`, `src/pages/CommunityPage.tsx`, `src/pages/HelpPage.tsx`, `api/report-bug.ts`, `landing/index.html`, `docs/migrations/008_bug_reports.sql` |

---

## v1.0 Status — Code Complete ✅

All 11 sprints are code-complete. **0 TypeScript errors · 29/29 tests passing.**

Remaining work is platform/submission only — see `docs/PENDING.md` for the full checklist.

**Live URL:** https://fitness-app-ten-eta.vercel.app
**Privacy policy:** https://fitness-app-ten-eta.vercel.app/privacy

---

## Post-v1.0 Roadmap (v1.1+)

### Sprint 11 — Wearables (Full) 💡
- Install `@capacitor-community/health` + `cap sync`
- Add HealthKit entitlement in Xcode (iOS) + Health Connect in AndroidManifest
- Submit app update to stores

### Sprint 12 — PDF Export 💡
- Export training program as formatted PDF
- Export workout history as PDF/CSV

### Sprint 13 — Advanced Program Progression 💡
- Progressive overload automation: auto-suggest next session targets from AdaptationResult
- Week-by-week program view with planned vs. actual volume
- Deload week detection (auto-drop volume when 3 sessions show RPE ≥ 9)

### Sprint 14 — AI Form Coach 💡
- Video capture during workout set
- Claude vision analysis of exercise form
- Cue suggestions overlaid on playback
- Requires careful App Store review strategy (camera permission + medical advice disclaimer)

### Sprint 15 — Enhanced Learning 💡
- Interactive exercise animations (Lottie or CSS)
- Video lesson integration
- Adaptive quiz difficulty based on past scores
- Course completion certificates (shareable PNG)

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
