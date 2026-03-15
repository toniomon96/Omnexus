# Documentation vs Implementation Report

## Implemented

| Documented Feature | Implementation Status | Evidence |
|---|---|---|
| AI onboarding and guest mode | Implemented | `src/pages/OnboardingPage.tsx`, `src/pages/GuestSetupPage.tsx`, `api/onboard.ts` |
| 8-week program generation | Implemented | `api/generate-program.ts`, `src/lib/programGeneration.ts` |
| Exercise library and discovery engine | Implemented | `src/pages/ExerciseLibraryPage.tsx`, `src/pages/ExerciseDetailPage.tsx`, `api/exercise-search.ts` |
| Gamification engine | Implemented | `src/store/AppContext.tsx`, `src/components/gamification/` |
| Learning system | Implemented | `src/data/courses.ts`, `src/components/learn/`, `api/generate-lesson.ts`, `api/recommend-content.ts` |
| Ask Omnexus AI coach | Implemented | `src/pages/AskPage.tsx`, `api/ask.ts`, `api/checkin.ts`, `api/ask-streaming.ts` |
| Program continuation and progression report | Implemented | `src/pages/ProgressionReportPage.tsx`, `api/progression-report.ts` |
| Community and challenges | Implemented | `src/pages/CommunityPage.tsx`, `src/pages/ChallengesPage.tsx`, `api/generate-personal-challenge.ts`, `api/generate-shared-challenge.ts` |
| Nutrition tracking | Implemented | `src/pages/NutritionPage.tsx`, `src/pages/PlateCalculatorPage.tsx` |
| Insights and adaptation system | Implemented | `src/pages/InsightsPage.tsx`, `api/insights.ts`, `api/adapt.ts`, `api/briefing.ts` |
| PubMed research feed | Implemented | `api/articles.ts`, `src/services/pubmedService.ts` |
| Push notifications | Implemented | `api/daily-reminder.ts`, `api/training-notifications.ts`, `api/weekly-digest.ts`, `src/lib/pushSubscription.ts` |
| Premium subscriptions | Implemented | `api/create-checkout.ts`, `api/webhook-stripe.ts`, `src/pages/SubscriptionPage.tsx` |
| Transformation timeline page | Implemented | `src/pages/TransformationTimelinePage.tsx` |

## Partially Implemented

| Documented Feature | Implementation Status | Evidence |
|---|---|---|
| Wearables integration | Partial | `src/lib/health.ts` and `HealthWidget` scaffolding exist, but roadmap-level full integration is deferred |
| Meal planning | Partial | `api/meal-plan.ts` exists, but no primary surfaced UI flow is present |
| Body Transformation Timeline roadmap vision | Partial | a timeline page exists, but the broader cross-domain artifact described in strategy docs is not fully realized |
| Wiki documentation mirror | Partial | content exists under `docs/wiki/`, but it no longer matches the active docs tree |

## Not Implemented

| Documented Feature | Implementation Status | Source Docs |
|---|---|---|
| PDF export for programs/history | Not implemented | `docs/roadmap/future-roadmap.md` |
| AI form coach / computer vision | Not implemented | `docs/roadmap/future-roadmap.md` |
| Offline-first sync with IndexedDB and background queue | Not implemented | `docs/roadmap/future-roadmap.md` |
| Full HealthKit / Health Connect ingestion | Not implemented | `docs/roadmap/future-roadmap.md` |
| In-app premium video content | Not implemented | `docs/roadmap/future-roadmap.md` |
| B2B multi-tenancy and gym admin tooling | Not implemented | `docs/roadmap/future-roadmap.md`, `docs/roadmap/market-expansion-plan.md` |
| Employer wellness / frontline-worker distribution track | Not implemented | `docs/roadmap/market-expansion-plan.md` |

## Plan Validation Summary

- `docs/archive/IMPLEMENTATION_PLAN.md` — implemented for its core epics; should remain archived as completed work.
- `docs/archive/V1_ENHANCEMENT_SPRINT_PLAN.md` — largely implemented; should remain archived as completed work.
- `docs/roadmap/future-roadmap.md` and `docs/roadmap/market-expansion-plan.md` — mixed implemented and future work; keep active in roadmap space.
