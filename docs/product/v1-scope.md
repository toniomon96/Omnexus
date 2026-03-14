# Omnexus V1 Scope

This document is the authoritative reference for what is included in the V1 release. Every feature listed here is fully implemented, tested, and production-ready.

**Code quality gates (as of V1):**
- 0 TypeScript errors
- 0 ESLint warnings
- 513 unit tests passing (Vitest)
- Production build successful
- 0 production dependency vulnerabilities

---

## Core Training Loop

| Feature | Status | Key Files |
|---|---|---|
| AI multi-turn onboarding with profile generation | ✅ Shipped | `api/onboard.ts`, `src/pages/OnboardingPage.tsx` |
| AI 8-week mesocycle generation | ✅ Shipped | `api/generate-program.ts` |
| Pre-built training programs | ✅ Shipped | `src/data/programs.ts`, `src/pages/ProgramsPage.tsx` |
| Custom program builder | ✅ Shipped | `src/pages/ProgramBuilderPage.tsx` |
| Active workout logging (sets, reps, weight, RPE) | ✅ Shipped | `src/pages/ActiveWorkoutPage.tsx` |
| Personal record detection + confetti | ✅ Shipped | `src/hooks/useWorkoutSession.ts` |
| Quick log (ad-hoc sessions outside programs) | ✅ Shipped | `src/pages/QuickLogPage.tsx` |
| Workout history with inline set editing | ✅ Shipped | `src/pages/HistoryPage.tsx` |
| Pre-workout briefing (AI coach notes) | ✅ Shipped | `api/briefing.ts`, `src/pages/PreWorkoutBriefingPage.tsx` |
| Post-session adaptation engine | ✅ Shipped | `api/adapt.ts` |
| Program continuation + Progression Report | ✅ Shipped | `api/progression-report.ts`, `src/pages/ProgressionReportPage.tsx` |
| Training DNA profile visualization | ✅ Shipped | `src/components/profile/TrainingDNA.tsx` |

---

## Exercise Library

| Feature | Status | Key Files |
|---|---|---|
| 316 exercises across 11 equipment categories | ✅ Shipped | `src/data/exercises/` |
| Exercise detail page (4-tab layout: How To, Mistakes, Variations, Cues) | ✅ Shipped | `src/pages/ExerciseDetailPage.tsx` |
| Equipment substitute finder | ✅ Shipped | `ExerciseDetailPage.tsx` |
| Exercise discovery (5 modes: search, pattern, muscle, equipment, difficulty) | ✅ Shipped | `src/pages/ExerciseLibraryPage.tsx` |
| Natural language semantic search (pgvector + OpenAI embeddings) | ✅ Shipped | `api/exercise-search.ts` |
| YouTube demo embeds | ✅ Shipped | `src/components/ui/YouTubeEmbed.tsx` |
| Personal best display (best set + estimated 1RM) | ✅ Shipped | `ExerciseDetailPage.tsx` |
| Progressive overload suggestions | ✅ Shipped | `src/lib/progressiveOverload.ts` |

---

## AI Coach (Omni)

| Feature | Status | Key Files |
|---|---|---|
| Coach mode (general fitness Q&A with RAG citations) | ✅ Shipped | `api/ask.ts` |
| Science mode (research-grounded answers from PubMed) | ✅ Shipped | `api/ask.ts` |
| Check-In mode (pre/post-workout pain and notes log) | ✅ Shipped | `api/checkin.ts` |
| Multi-turn conversation with session persistence | ✅ Shipped | `src/pages/AskPage.tsx` |
| Follow-up suggestion chips | ✅ Shipped | `AskPage.tsx` |
| Streaming response support | ✅ Shipped | `api/ask-streaming.ts` |
| Prompt injection safety | ✅ Shipped | `api/_aiSafety.ts` |
| OpenAI fallback when Anthropic unavailable | ✅ Shipped | `api/ask.ts` |

---

## Learning System

| Feature | Status | Key Files |
|---|---|---|
| 15 structured courses (Nutrition ×4, Science ×4, Technique ×4, Mind ×3) | ✅ Shipped | `src/data/courses.ts` |
| Quiz engine (multiple choice, true/false, combo multiplier) | ✅ Shipped | `src/components/learn/QuizBlock.tsx` |
| SM-2 spaced repetition review system | ✅ Shipped | `src/utils/spacedRep.ts` |
| Daily challenge | ✅ Shipped | `src/utils/dailyChallenge.ts` |
| Checkpoint questions in lesson reader | ✅ Shipped | `src/components/learn/LessonReader.tsx` |
| AI-generated micro-lessons (dynamic content from PubMed context) | ✅ Shipped | `api/generate-lesson.ts` |
| AI-powered course recommendations | ✅ Shipped | `api/recommend-content.ts` |
| Course completion certificate + shareable PNG | ✅ Shipped | `src/pages/CourseDetailPage.tsx`, `src/utils/shareCard.ts` |

---

## Gamification

| Feature | Status | Key Files |
|---|---|---|
| XP system (workouts, learning, streaks, achievements) | ✅ Shipped | `src/store/AppContext.tsx` |
| Ranks (Recruit → Legend) | ✅ Shipped | `src/components/gamification/RankBadge.tsx` |
| Training streaks with streak-freeze | ✅ Shipped | `src/utils/streakUtils.ts` |
| Sparks (hard currency) | ✅ Shipped | `AppContext.tsx` |
| Achievements system | ✅ Shipped | `AppContext.tsx` |
| Rank-up celebration overlay (confetti, animation) | ✅ Shipped | `src/components/gamification/CelebrationOverlay.tsx` |
| Achievement toast notifications | ✅ Shipped | `src/components/gamification/GamificationNotifier.tsx` |
| Weekly XP leaderboard (global + friends) | ✅ Shipped | `src/pages/LeaderboardPage.tsx` |
| Block missions (per-program weekly goals) | ✅ Shipped | `api/generate-missions.ts` |
| Shareable workout recap + streak milestone cards | ✅ Shipped | `src/utils/shareCard.ts` |

---

## Community

| Feature | Status | Key Files |
|---|---|---|
| Friends (send/accept/decline requests) | ✅ Shipped | `src/pages/FriendsPage.tsx` |
| Real-time activity feed with emoji reactions | ✅ Shipped | `src/pages/ActivityFeedPage.tsx` |
| Individual AI-generated personal challenges | ✅ Shipped | `api/generate-personal-challenge.ts` |
| Weekly shared community challenge | ✅ Shipped | `api/generate-shared-challenge.ts` |
| Cooperative team challenges | ✅ Shipped | `src/pages/ChallengesPage.tsx` |
| Peer insights (anonymous aggregate benchmarks) | ✅ Shipped | `api/peer-insights.ts` |

---

## Research Feed

| Feature | Status | Key Files |
|---|---|---|
| Live PubMed articles across 7 categories | ✅ Shipped | `api/articles.ts` |
| 6-hour client-side cache | ✅ Shipped | `src/services/pubmedService.ts` |
| Personalized article recommendations | ✅ Shipped | `api/recommend-content.ts` |

---

## Insights & Analytics

| Feature | Status | Key Files |
|---|---|---|
| 4-week training analysis (volume, frequency, recovery) | ✅ Shipped | `api/insights.ts` |
| AI-generated adaptation notes after each session | ✅ Shipped | `api/adapt.ts` |
| Volume delta badge in workout completion modal | ✅ Shipped | `src/components/workout/WorkoutCompleteModal.tsx` |
| Workout heatmap calendar | ✅ Shipped | `src/components/history/HeatmapCalendar.tsx` |
| Volume chart (per muscle group over time) | ✅ Shipped | `src/components/history/VolumeChart.tsx` |
| Exercise progress chart (per-exercise weight trend) | ✅ Shipped | `src/components/exercise-library/ExerciseProgressChart.tsx` |
| Measurements tracking with trend visualization | ✅ Shipped | `src/pages/MeasurementsPage.tsx` |
| PostHog analytics integration (8 tracked events) | ✅ Shipped | `src/lib/analytics.ts` |

---

## Nutrition

| Feature | Status | Key Files |
|---|---|---|
| Daily macro logging (calories, protein, carbs, fat) | ✅ Shipped | `src/pages/NutritionPage.tsx` |
| Macro goals with progress bars | ✅ Shipped | `NutritionPage.tsx` |
| Date navigator for historical logs | ✅ Shipped | `NutritionPage.tsx` |
| Quick-add common meals | ✅ Shipped | `NutritionPage.tsx` |
| Plate composition calculator | ✅ Shipped | `src/pages/PlateCalculatorPage.tsx` |

---

## Authentication & Accounts

| Feature | Status | Key Files |
|---|---|---|
| Email + password signup with branded confirmation email | ✅ Shipped | `api/signup.ts` |
| Sign-in with brute-force rate limiting + lockout | ✅ Shipped | `api/signin.ts` |
| Password reset via Supabase email | ✅ Shipped | `api/reset-password.ts` |
| Guest mode (no account required) | ✅ Shipped | `src/pages/GuestSetupPage.tsx` |
| Guest → account data migration | ✅ Shipped | `src/components/ui/GuestDataMigrationModal.tsx` |
| Cross-device cloud sync via Supabase | ✅ Shipped | `src/lib/db.ts` |
| GDPR: cookie consent | ✅ Shipped | `src/components/ui/CookieConsent.tsx` |
| GDPR: full data export (JSON) | ✅ Shipped | `api/export-data.ts` |
| GDPR: account deletion | ✅ Shipped | `api/delete-account.ts` |
| Profile picture upload (Supabase Storage) | ✅ Shipped | `api/setup-profile.ts` |

---

## Premium Subscription

| Feature | Status | Key Files |
|---|---|---|
| Stripe checkout session | ✅ Shipped | `api/create-checkout.ts` |
| Stripe webhook sync | ✅ Shipped | `api/webhook-stripe.ts` |
| Customer portal (manage/cancel) | ✅ Shipped | `api/customer-portal.ts` |
| Subscription status gating | ✅ Shipped | `api/subscription-status.ts` |
| Free tier AI limits (5 asks/day) | ✅ Shipped | `AppContext.tsx` |
| Subscription page | ✅ Shipped | `src/pages/SubscriptionPage.tsx` |

---

## Push Notifications

| Feature | Status | Key Files |
|---|---|---|
| Web Push (VAPID) subscription management | ✅ Shipped | `src/lib/pushSubscription.ts`, `public/sw.js` |
| Daily workout reminder (cron: 9 AM UTC) | ✅ Shipped | `api/daily-reminder.ts` |
| Training notifications (cron: 5 PM UTC) | ✅ Shipped | `api/training-notifications.ts` |
| Weekly volume digest (cron: 8 AM UTC Mondays) | ✅ Shipped | `api/weekly-digest.ts` |
| Friend workout push alerts | ✅ Shipped | `api/notify-friends.ts` |
| Notification preferences | ✅ Shipped | `src/pages/NotificationsPage.tsx` |

---

## Security & Infrastructure

| Feature | Status | Key Files |
|---|---|---|
| CORS strict enforcement (403 on unknown origins) | ✅ Shipped | `api/_cors.ts` |
| Upstash Redis rate limiting (20 req/10 min/IP) | ✅ Shipped | `api/_rateLimit.ts` |
| Prompt injection whitelist | ✅ Shipped | `api/_aiSafety.ts` |
| Content-Security-Policy on all API responses | ✅ Shipped | `api/_cors.ts` |
| HSTS + X-Frame-Options + Referrer-Policy headers | ✅ Shipped | `api/_cors.ts` |
| HTTPS enforcement (x-forwarded-proto check) | ✅ Shipped | `api/_cors.ts` |
| Auth brute-force protection + account lockout | ✅ Shipped | `api/signin.ts` |
| Cron endpoints fail-closed without CRON_SECRET | ✅ Shipped | all cron handlers |

---

## Native & PWA

| Feature | Status | Key Files |
|---|---|---|
| Capacitor v8 iOS native project | ✅ Shipped | `ios/`, `capacitor.config.ts` |
| Capacitor v8 Android native project | ✅ Shipped | `android/`, `capacitor.config.ts` |
| Haptic feedback | ✅ Shipped | `src/lib/capacitor.ts` |
| Status bar + splash screen + safe areas | ✅ Shipped | `src/lib/capacitor.ts` |
| Android hardware back button | ✅ Shipped | `src/lib/capacitor.ts` |
| PWA manifest | ✅ Shipped | `public/manifest.json` |
| Service worker (Web Push handler) | ✅ Shipped | `public/sw.js` |
| HealthKit/Health Connect code scaffolding | ⏸ Deferred to V1.1 | `src/lib/health.ts`, `src/components/dashboard/HealthWidget.tsx` |

---

## What Is NOT in V1

The following items are planned for post-V1 releases. See `docs/ROADMAP.md` for full details.

| Feature | Target Release |
|---|---|
| Full HealthKit + Health Connect integration | V1.1 |
| PDF export (programs + workout history) | V1.2 |
| Progressive overload automation (auto-suggest next-session targets) | V1.3 |
| AI computer vision form coach (MediaPipe/MoveNet) | V2.0 |
| Offline-first IndexedDB sync | V2.0 |
| AI-generated meal plans | V2.0 |
| Gym/B2B licensing and multi-tenancy | V3.0 |
