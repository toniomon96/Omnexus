# Omnexus — Full UX Audit
*Generated: 2026-03-07 | Codebase: v1.0 (all sprints complete)*

---

## SECTION 1 — APP MAP

```
Omnexus
├── Public Zone (no auth required)
│   ├── /login              LoginPage
│   ├── /guest              GuestSetupPage
│   ├── /onboarding         OnboardingPage
│   ├── /auth/callback      AuthCallbackPage
│   ├── /reset-password     ResetPasswordPage
│   ├── /privacy            PrivacyPolicyPage
│   └── /landing            LandingPage
│
├── Guest + Auth Zone (GuestOrAuthGuard)
│   ├── / (Home)            DashboardPage
│   ├── /profile            ProfilePage
│   ├── /programs           ProgramsPage
│   ├── /programs/builder   ProgramBuilderPage
│   ├── /programs/:id       ProgramDetailPage
│   ├── /train              TrainPage
│   ├── /library            ExerciseLibraryPage
│   ├── /library/:id        ExerciseDetailPage
│   ├── /workout/active     ActiveWorkoutPage
│   ├── /briefing           PreWorkoutBriefingPage
│   ├── /history            HistoryPage
│   ├── /learn              LearnPage
│   ├── /learn/:courseId             CourseDetailPage
│   ├── /learn/:courseId/:moduleId   LessonPage
│   ├── /insights           InsightsPage
│   ├── /ask                AskPage
│   ├── /nutrition          NutritionPage
│   ├── /nutrition/quick-log QuickLogPage
│   ├── /measurements       MeasurementsPage
│   ├── /plate-calculator   PlateCalculatorPage
│   └── /help               HelpPage
│
└── Auth-Only Zone (AuthOnlyGuard — Supabase required)
    ├── /feed               ActivityFeedPage
    ├── /friends            FriendsPage
    ├── /leaderboard        LeaderboardPage
    ├── /challenges         ChallengesPage
    └── /community          CommunityPage
```

**Navigation frame:** `AppShell` wraps all authenticated pages with `TopBar` (top) + `BottomNav` (bottom, 5 tabs: Home · Train · Community · Learn · Insights). Pages using `AppShell` automatically receive bottom padding to avoid nav overlap.

---

## SECTION 2 — COMPLETE USER FLOWS

### Flow 1: New User — AI-Onboarded (Email)
```
/login → "Create account" → OnboardingPage (chat form, 9 questions)
  → api/onboard (Claude AI profile summary)
  → api/generate-program (Claude AI 8-week program, async ~15-30s)
  → Redirect to / (DashboardPage)
     ├── genStatus = 'generating' → spinner card shown
     └── genStatus = 'ready' → emerald "Program ready" banner
         → User clicks "View →" → /programs/:id
```

### Flow 2: New User — Guest (Quick)
```
/login → "Try as guest" → /guest (GuestSetupPage)
  → 2-step: goal picker → experience level picker
  → Auto-match program from static library
  → Redirect to /
  → GuestBanner fixed top (amber) all pages
  → "Save progress" → /onboarding (upgrade path)
```

### Flow 3: Returning User — Login
```
/login → email+password → Supabase auth
  ├── Unconfirmed email → inline warning message shown
  ├── Wrong password → inline error (generic message to avoid enumeration)
  └── Success → router hydration (AppContext) → / (DashboardPage)
      └── resumeIfNeeded() called → restarts any stale async generation
```

### Flow 4: Email Verification
```
Signup email → link click → /auth/callback
  ├── SIGNED_IN event → "Email confirmed!" → / (2s delay)
  ├── PASSWORD_RECOVERY event → /reset-password (1.2s delay)
  └── Timeout (6s) → getSession() fallback → / or "Link expired" error
```

### Flow 5: Password Reset
```
/login → "Forgot password?" → inline form → Supabase sendPasswordResetEmail
  → Email sent toast → link click → /auth/callback → /reset-password
  → New password form → Supabase updateUser → success → /login
```

### Flow 6: Core Training Loop
```
/ (DashboardPage) → TodayCard → "View Briefing" → /briefing
  → PreWorkoutBriefingPage (AI brief, target sets/volume shown)
  → "Start Workout" → /workout/active
  → ActiveWorkoutPage:
      ├── Set rows: weight/reps inputs → tap checkmark to complete
      ├── + Add Set button per exercise
      ├── Rest timer bottom-sheet (after completing a set)
      ├── + Add Exercise → ExercisePickerSheet
      ├── Timer header with live duration
      └── "Finish Workout" → WorkoutCompleteModal
          ├── Summary tab: duration, volume, sets + PR list
          ├── Next Session tab: AI adaptation suggestions
          ├── Share PR card (if PR achieved)
          └── CTA: Dashboard | History
```

### Flow 7: Quick Log Workout
```
/train → "Quick Log" → /workout/active?quick=true
  → ExercisePickerSheet opens immediately
  → Same ActiveWorkoutPage flow
```

### Flow 8: Custom Program Builder
```
/programs → "Build custom" → /programs/builder
  → ProgramBuilderPage: name, goal, days/week, exercises per day
  → Save → stored in localStorage (omnexus_custom_programs)
  → /programs/:id (detail view)
```

### Flow 9: AI Program Generation (Full)
```
/onboarding → 9 AI questions → api/onboard (profile) → api/generate-program
  ├── Generation state in localStorage (omnexus_program_generation)
  ├── Polling via useProgramGeneration hook (pub/sub events)
  └── On complete: stored in omnexus_custom_programs
      → DashboardPage: activates program + clears generation state (8s delay)
```

### Flow 10: Learning
```
/learn → LearnPage (course cards, with progress indicators)
  → /learn/:courseId → CourseDetailPage (modules list)
  → /learn/:courseId/:moduleId → LessonPage
      ├── Read lesson content
      ├── Micro-lesson quiz (AI generated)
      └── Complete → progress saved to localStorage + Supabase (debounced 2s)
```

### Flow 11: AI Insights
```
/insights → InsightsPage
  ├── Workout analysis (from last omnexus_last_adaptation localStorage)
  └── Peer comparisons (AuthOnly — Supabase friends data)

/ask → AskPage
  ├── Text input → api/ask (Claude RAG with pgvector)
  ├── "Sources used" citations shown below answer
  └── Suggested follow-up questions
```

### Flow 12: Nutrition Tracking
```
/nutrition → NutritionPage
  ├── Date nav (prev/next day)
  ├── Macro summary ring
  ├── Meal log (breakfast/lunch/dinner/snacks)
  ├── + Add Food → modal
  ├── AI Meal Plan button → Claude-generated plan
  └── /nutrition/quick-log → QuickLogPage (barcode-style quick entry)
```

### Flow 13: Community — Social
```
/community → CommunityPage (hub: Feed / Friends / Leaderboard / Challenges)
  ├── /feed → ActivityFeedPage (workout posts, reactions)
  ├── /friends → FriendsPage (search by email, friend cards)
  ├── /leaderboard → LeaderboardPage (weekly volume ranking)
  └── /challenges → ChallengesPage
      ├── Active challenges list + progress bars
      ├── Create challenge modal (type, target, dates)
      ├── Invite friends → FriendPicker
      ├── Cooperative mode toggle
      ├── Challenge leaderboard (lazy, gold/silver/bronze medals)
      └── Real-time invitation banner (Supabase Realtime channel)
```

### Flow 14: Profile & Settings
```
/profile → ProfilePage
  ├── Avatar upload (5MB limit, Supabase Storage 'avatars' bucket)
  ├── Account info (email, joined date)
  ├── Subscription plan + /subscription link
  ├── Edit Profile form (name, goal, experience)
  ├── Password Change (authenticated only)
  ├── Export Data (JSON download)
  ├── Notifications toggle
  ├── Theme toggle
  ├── Help → /help
  ├── Sign Out → clears localStorage → /login
  └── Danger Zone: Delete Account (ConfirmDialog)
```

### Flow 15: Guest → Auth Upgrade
```
GuestBanner "Save progress" → /onboarding
  → Full AI onboarding chat
  → Supabase account created
  → Guest localStorage data NOT migrated (R1 risk)
```

---

## SECTION 3 — SCREEN-BY-SCREEN INVENTORY

### DashboardPage (`/`)
- **Guards:** GuestOrAuthGuard
- **Components:** TopBar, TodayCard, StreakDisplay, RecoveryScoreCard, MuscleHeatMap, WeeklyRecapCard, Card
- **Conditional sections:**
  - Greeting + streak (always)
  - `genStatus='ready'` banner (emerald — program just generated)
  - `genStatus='generating'` card (brand spinner + progress bar)
  - Active session resume banner (if `activeSession` exists)
  - TodayCard (if program + no active session)
  - No-program prompt card → `/train`
  - AI Insights teaser → `/insights`
  - RecoveryScoreCard (always)
  - MuscleHeatMap (always)
  - WeeklyRecapCard (always)
  - Deload warning (if week >= 4)
- **Entry points:** `/workout/active` (resume), `/briefing` (via TodayCard), `/train`, `/insights`, `/ask`, `/programs/:id`

### TrainPage (`/train`)
- **Guards:** GuestOrAuthGuard
- **Sections:** Resume banner (if active), Today's Workout → /briefing, Quick Log, Program browser cards, Recent sessions

### ActiveWorkoutPage (`/workout/active`)
- **Guards:** GuestOrAuthGuard
- **State:** Reads `state.activeSession`, `useProgramGeneration`
- **Key interactions:** updateSet, addSet, removeSet, addExercise, completeWorkout, discardWorkout
- **Modals:** ExercisePickerSheet (add exercise), RestTimer bottom-sheet, WorkoutCompleteModal, ConfirmDialog (discard)

### PreWorkoutBriefingPage (`/briefing`)
- **Guards:** GuestOrAuthGuard
- **API:** `api/briefing` (Claude AI session brief)
- **Loader:** Spinner while loading, graceful empty state if fails

### WorkoutCompleteModal
- **Not a route** — rendered inside ActiveWorkoutPage
- **Tabs:** Summary | Next Session
- **API:** `getAdaptation()` → `api/adapt` (skipped for guest users)
- **Confetti:** Canvas animation (80 particles, 140 frames) triggered if PRs detected
- **Haptic:** `triggerHapticNotification('success')` on PR

### ProgramsPage (`/programs`)
- **Sections:** Active program card, Recommended programs, All programs, Custom programs

### ProgramDetailPage (`/programs/:id`)
- **Sections:** Header, Training Philosophy (if AI-generated), 8-Week Roadmap (collapsible), Schedule (day-by-day exercise list), Activate/Deactivate button

### ExerciseLibraryPage (`/library`)
- **Sections:** Search bar, muscle group filter chips, exercise cards

### ExerciseDetailPage (`/library/:id`)
- **Sections:** Muscle tags, equipment, difficulty, YouTube Demo embed (lazy thumbnail → iframe), PR history, AI Progression Suggestion, How To steps, Pro Tips, Related Learning

### HistoryPage (`/history`)
- **View toggle:** List | Calendar
- **Sections:** Summary stats grid (total workouts, total volume in tonnes), Personal Records card (top 5), VolumeChart (weekly, 4 weeks), HeatmapCalendar, SessionList, Empty state

### InsightsPage (`/insights`)
- **Sections:** AdaptationCard (from `omnexus_last_adaptation` localStorage), PeerInsightsCard (auth-only), Workout Analysis button, Quick Questions → /ask, Latest Research (ArticleFeed by goal), Safety disclaimer

### AskPage (`/ask`)
- **API:** `api/ask` (Claude + pgvector RAG)
- **State:** Conversation history in component state (not persisted), citations list
- **Prefill:** `location.state.prefill` supported (used by deload warning)
- **Conversation limit:** 4 exchanges before context warning shown

### LearnPage (`/learn`)
- **Sections:** Course cards with progress, featured content

### NutritionPage (`/nutrition`)
- **State:** `omnexus_nutrition_goals` localStorage
- **Sections:** Date nav, macro ring, meal sections, AI meal plan

### ProfilePage (`/profile`)
- **Guards:** GuestOrAuthGuard (guest users see limited view — no password change, no delete)
- **Sections:** Avatar (with camera overlay), account info, subscription, edit form, guest upgrade CTA, password change, export, notifications, theme, help, sign out, danger zone

### CommunityPage (`/community`)
- **Guards:** AuthOnlyGuard
- **Content:** Hub cards to Feed / Friends / Leaderboard / Challenges

### ChallengesPage (`/challenges`)
- **Guards:** AuthOnlyGuard
- **Realtime:** Supabase channel for invitation events

### LoginPage (`/login`)
- **Sections:** Sign in form, inline forgot-password form, "Create account" → /onboarding, "Try as guest" → /guest

### OnboardingPage (`/onboarding`)
- **Flow:** OnboardingChat (AI-driven multi-step form) → ProfileSummaryCard → async generation starts → redirect to /

### GuestSetupPage (`/guest`)
- **Flow:** Goal picker (step 1) → Experience level picker (step 2) → redirect to /
- **No AI calls** — purely static matching

---

## SECTION 4 — STATE TRANSITIONS

### Auth State Machine
```
[Unauthenticated] --login--> [Authenticated]
[Unauthenticated] --guest--> [Guest]
[Guest] --"Save progress"--> [Onboarding] --complete--> [Authenticated]
[Authenticated] --sign-out--> [Unauthenticated] (localStorage cleared)
[Authenticated] --delete--> [Unauthenticated] (account + data destroyed)
```

### Workout Session State Machine
```
[No Session] --startWorkout/startQuickWorkout--> [Active Session]
[Active Session] --updateSet/addSet/removeSet--> [Active Session]
[Active Session] --completeWorkout--> [Complete Modal] --navigate--> [No Session]
[Active Session] --discardWorkout--> [No Session]
[App reload with active session] --hydrateFromLocalStorage--> [Active Session]
```

### Program Generation State Machine
```
[idle] --onboard complete--> [generating]
[generating] --api returns--> [ready]
[ready] --8s timer--> [idle]
[generating] --app reload--> [generating] (resumeIfNeeded restores state)
[generating] --error--> [error] --retry--> [generating]
```

### Learning Progress State Machine
```
[not started] --open lesson--> [in progress]
[in progress] --complete quiz--> [completed]
[completed] --revisit--> [completed] (idempotent)
Progress persisted: localStorage (immediate) + Supabase (debounced 2s)
```

---

## SECTION 5 — UX RISK AREAS

### R1 — Guest Data Loss on Upgrade
**Severity:** High
Guest localStorage data (workouts, PRs, nutrition logs) is NOT migrated when a guest signs up. User loses all prior session history silently.
**Recommendation:** Implement migration step in OnboardingPage that reads `omnexus_guest` data and syncs to Supabase post-signup.

### R2 — No Back Navigation from Active Workout
**Severity:** High
ActiveWorkoutPage has no explicit intercept for browser back. Accidental browser back could cause confusion without triggering the ConfirmDialog.
**Recommendation:** Intercept browser back during active workout with the ConfirmDialog.

### R3 — Program Generation Fails Silently
**Severity:** High
If `api/generate-program` fails (timeout, rate limit), `genStatus` moves to `'error'` but there is no prominent user-facing error message on DashboardPage.
**Recommendation:** Show error state card on Dashboard with retry CTA.

### R4 — AI Briefing Not Cached
**Severity:** Medium
Every visit to `/briefing` triggers a fresh API call. No caching by day/session means double-tapping back/forward re-fetches and costs tokens.
**Recommendation:** Cache briefing response keyed by `sessionId+date` in localStorage with 4h TTL.

### R5 — WorkoutCompleteModal Cannot Be Dismissed
**Severity:** Medium
`WorkoutCompleteModal` has no close/X button. Users must navigate to Dashboard or History. If triggered unexpectedly, there is no way to go back.
**Recommendation:** Add close/X button with "are you sure?" confirmation before dismissing.

### R6 — Nutrition State Not Synced to Cloud
**Severity:** Medium
Nutrition goals and logs are localStorage-only (`omnexus_nutrition_goals`). No Supabase sync means data is device-local.
**Recommendation:** Add `nutrition_logs` Supabase table + sync in NutritionPage.

### R7 — AskPage Conversation Not Persisted
**Severity:** Medium
Conversation history in AskPage is component state only — navigating away clears the entire chat.
**Recommendation:** Persist conversation to `omnexus_ask_history` sessionStorage.

### R8 — No Offline Indicator
**Severity:** Medium
App does not detect or communicate offline state. API calls fail silently. On mobile (Capacitor), users may expect offline support.
**Recommendation:** Add `navigator.onLine` + event listener; show toast on offline.

### R9 — Measurements Not Synced
**Severity:** Medium
MeasurementsPage data (`omnexus_measurements` localStorage) has no Supabase sync.
**Recommendation:** Add `measurements` Supabase table.

### R10 — BottomNav Community Tab Confuses Guests
**Severity:** Low-Medium
Community tab is visible for all users including guests, but all community routes are AuthOnlyGuard. Guests see a redirect to login without explanation.
**Recommendation:** Show a "Sign up to access community" interstitial instead of silent redirect.

### R11 — Z-Index Layer System Undocumented
**Severity:** Low
GuestBanner is `z-20`, TopBar is `z-30`. If any new component is added at `z-20` or below, it may render behind the GuestBanner on guest sessions.
**Recommendation:** Document the z-index layer system to prevent future collisions.

### R12 — No Exercise Search in Active Workout Picker
**Severity:** Low-Medium
ExercisePickerSheet in ActiveWorkoutPage — if the picker lacks search, adding exercises mid-workout is slow with 51 exercises.
**Recommendation:** Verify search is available; add muscle-group filter chips if missing.

### R13 — Share Card Requires Canvas Support
**Severity:** Low
`generatePRCard` uses HTML Canvas. On some older Android WebViews this may fail silently.
**Recommendation:** Add try/catch around share card generation with fallback toast.

### R14 — Deload Warning Ignores Program Deload Weeks
**Severity:** Low
The deload warning appears at week >= 4 regardless of whether the program has a built-in deload week.
**Recommendation:** Add `deloadWeek` field to Program and only show if current week is not a designated deload week.

### R15 — Password Change Section Lacks Auth Provider Check
**Severity:** Low
Password change UI is visible for all authenticated users. Future OAuth users (if added) would be confused by this section.
**Recommendation:** Guard with `identities` check from Supabase user object.

### R16 — TopBar Back Button Requires Explicit Prop Threading
**Severity:** Low
TopBar uses a `backTo` prop for back navigation. If routes change, prop threading must be updated manually.
**Recommendation:** Consider defaulting to `useNavigate(-1)` with an explicit opt-out prop.

### R17 — No Empty State on Activity Feed (No Friends)
**Severity:** Low
ActivityFeedPage with zero friends/zero posts likely shows an empty list without a "find friends" CTA.
**Recommendation:** Add empty state with link to /friends.

### R18 — Challenge Cooperative Mode Requires Migrations
**Severity:** Low
Cooperative challenges require `is_cooperative` column + `challenge_invitations` table with specific RLS. If migrations have not been run, ChallengesPage silently breaks.
**Recommendation:** Add migration-check guard or handle missing column gracefully.

### R19 — Wearables Feature Code Present but Disabled
**Severity:** Info
HealthWidget exists in codebase and DashboardPage, but Sprint 7 is NOT enabled in v1.0 (HealthKit entitlement excluded). The code is present but no-op on web.
**Recommendation:** Document this as a v1.x feature flag; add `ENABLE_HEALTH` env var.

---

## SECTION 6 — DATA / LOGIC DEPENDENCIES

### Critical Dependencies

| Consumer | Depends On | Risk if Missing |
|---|---|---|
| DashboardPage TodayCard | `user.activeProgramId` -> program lookup | Shows "no program" card |
| WorkoutCompleteModal NextSessionTab | `getAdaptation()` API | Shows "No adaptation data" |
| InsightsPage | `omnexus_last_adaptation` localStorage | Empty state |
| AskPage RAG | pgvector embeddings in Supabase | Falls back to non-grounded Claude |
| ChallengesPage | `is_cooperative` DB column | Potential runtime error |
| ProfilePage avatar | Supabase Storage 'avatars' bucket | Upload fails |
| LessonPage progress | Supabase `learning_progress` table | Local-only fallback |
| FriendFeed | PostgREST join on `activity_feed` + `profiles` | Falls back to parallel queries |

### Async Generation Data Flow
```
OnboardingPage
  -> api/onboard -> UserTrainingProfile (stored in component, passed to generate)
  -> api/generate-program -> returns Program JSON
  -> programGeneration.ts: stores to localStorage (omnexus_custom_programs)
                           updates generation state (omnexus_program_generation)
                           fires 'program-generation-complete' CustomEvent
  -> useProgramGeneration hook (all components subscribe via polling/event)
  -> DashboardPage useEffect: reads generatedProgramId -> activates on user
  -> Supabase profiles: active_program_id synced
```

---

## SECTION 7 — V1 IMPROVEMENT PRIORITY TAGS

| # | Issue | Priority | Effort |
|---|---|---|---|
| R1 | Guest data loss on upgrade | `P0-critical` | High |
| R3 | Generation error not surfaced on Dashboard | `P1-high` | Low |
| R7 | AskPage conversation lost on navigate | `P1-high` | Low |
| R8 | No offline indicator | `P1-high` | Low |
| R2 | No back intercept in active workout | `P2-medium` | Medium |
| R4 | AI briefing not cached | `P2-medium` | Low |
| R6 | Nutrition not synced to cloud | `P2-medium` | High |
| R10 | Community tab confuses guests | `P2-medium` | Low |
| R5 | Complete modal not dismissible | `P3-low` | Low |
| R12 | No search in exercise picker | `P3-low` | Medium |
| R17 | Empty feed state (no friends) | `P3-low` | Low |

---

## SECTION 8 — OPEN QUESTIONS

1. Is QuickLogPage (`/nutrition/quick-log`) used for nutrition OR workout quick-log? The route suggests nutrition, but "Quick Log" in TrainPage navigates to `/workout/active`. Confirm both entry points are intentional.

2. Does LandingPage (`/landing`) have a route guard? Is it shown to logged-out users as an alternative to `/login`, or is it only accessible via direct URL?

3. What happens when a user deletes their account — does Supabase cascade delete sessions, PRs, and learning progress? Are Storage objects (avatars) cleaned up?

4. Is `omnexus_tutorial_seen` cleared on sign-out? If a user signs into a new account on the same device, they will not see the tutorial.

5. The `sessionsWithNoProfile` module-level Set in router.tsx accumulates user IDs in memory. Does it grow unbounded on page reload, or is it cleared?

6. AppTutorial is only shown for authenticated users. Should guests see a simplified onboarding tour since they skip the AI chat?

7. Are rate limit errors (429 from Upstash) surfaced to the user with a friendly message?

8. `api/notify-friends` is called fire-and-forget after every completed workout. What does this endpoint do exactly, and are there failure scenarios that should be surfaced?

---

## APPENDIX A — ALL ROUTES AND ENTRY POINTS

| Route | Component | Guard | Primary Entry Points |
|---|---|---|---|
| `/login` | LoginPage | Public | App root redirect, sign-out, GuestBanner link |
| `/onboarding` | OnboardingPage | Public | LoginPage "Create account", GuestBanner "Save progress" |
| `/guest` | GuestSetupPage | Public | LoginPage "Try as guest" |
| `/auth/callback` | AuthCallbackPage | Public | Email verification link, password reset link |
| `/reset-password` | ResetPasswordPage | Public | /auth/callback (PASSWORD_RECOVERY) |
| `/privacy` | PrivacyPolicyPage | Public | External link |
| `/landing` | LandingPage | Public | Direct URL |
| `/` | DashboardPage | GuestOrAuth | BottomNav Home, post-login redirect |
| `/profile` | ProfilePage | GuestOrAuth | TopBar avatar |
| `/programs` | ProgramsPage | GuestOrAuth | TrainPage, TopBar |
| `/programs/builder` | ProgramBuilderPage | GuestOrAuth | ProgramsPage |
| `/programs/:id` | ProgramDetailPage | GuestOrAuth | ProgramsPage, DashboardPage banner |
| `/train` | TrainPage | GuestOrAuth | BottomNav Train |
| `/library` | ExerciseLibraryPage | GuestOrAuth | TrainPage tools |
| `/library/:id` | ExerciseDetailPage | GuestOrAuth | ExerciseLibraryPage |
| `/workout/active` | ActiveWorkoutPage | GuestOrAuth | TodayCard "Start", TrainPage "Quick Log", Dashboard "Resume" |
| `/briefing` | PreWorkoutBriefingPage | GuestOrAuth | TodayCard "View Briefing" |
| `/history` | HistoryPage | GuestOrAuth | WorkoutCompleteModal, TrainPage |
| `/learn` | LearnPage | GuestOrAuth | BottomNav Learn |
| `/learn/:courseId` | CourseDetailPage | GuestOrAuth | LearnPage |
| `/learn/:courseId/:moduleId` | LessonPage | GuestOrAuth | CourseDetailPage |
| `/insights` | InsightsPage | GuestOrAuth | BottomNav Insights, Dashboard AI card |
| `/ask` | AskPage | GuestOrAuth | InsightsPage, Dashboard deload warning |
| `/nutrition` | NutritionPage | GuestOrAuth | Dashboard quick-actions |
| `/nutrition/quick-log` | QuickLogPage | GuestOrAuth | NutritionPage |
| `/measurements` | MeasurementsPage | GuestOrAuth | ProfilePage, Dashboard quick-actions |
| `/plate-calculator` | PlateCalculatorPage | GuestOrAuth | TrainPage tools |
| `/help` | HelpPage | GuestOrAuth | ProfilePage |
| `/community` | CommunityPage | AuthOnly | BottomNav Community |
| `/feed` | ActivityFeedPage | AuthOnly | CommunityPage |
| `/friends` | FriendsPage | AuthOnly | CommunityPage |
| `/leaderboard` | LeaderboardPage | AuthOnly | CommunityPage |
| `/challenges` | ChallengesPage | AuthOnly | CommunityPage |
| `/subscription` | SubscriptionPage | AuthOnly | ProfilePage |

---

## APPENDIX B — ALL LOADERS / WAIT STATES / SKELETONS

| Location | Trigger | Treatment |
|---|---|---|
| DashboardPage | `genStatus='generating'` | Brand spinner card + animated progress bar |
| DashboardPage | No program + generating | Skeleton card (3 animated pulse lines) |
| AuthCallbackPage | Waiting for auth event | Spinning border circle + "Verifying..." text |
| WorkoutCompleteModal | `adaptLoading=true` | Loader2 spinner in "Next Session" tab label |
| WorkoutCompleteModal (Next tab) | `adaptLoading=true` | Full tab spinner + "Analyzing your session..." |
| PreWorkoutBriefingPage | API fetch | Spinner while loading |
| AskPage | API fetch | Streaming loader |
| LearnPage | Content load | Skeleton cards |
| InsightsPage | Data fetch | Skeleton cards |
| ShareCardModal | Canvas generation | Loader while generating image |
| ProgramBuilderPage | Save | Button loading state |
| OnboardingPage | AI generation starts | ProfileSummaryCard 4-stage animated messages |
| TopBar | Program generating (global) | Spinner indicator via useProgramGeneration |
| HistoryPage | First mount | Skeleton session cards (3) |
| ExerciseDetailPage | Related lessons fetch | Skeleton cards |

---

## APPENDIX C — ALL EMPTY STATES

| Screen | Condition | Message / Action |
|---|---|---|
| DashboardPage | No program, not generating | "Set up a training program" + "Get Started" -> /train |
| HistoryPage | No sessions | Clock icon + "No workouts yet" |
| InsightsPage | No `omnexus_last_adaptation` | Empty/placeholder state |
| ActivityFeedPage | No friends/posts | Likely empty list (R17 risk — no "find friends" CTA) |
| WorkoutCompleteModal (Next tab) | No adaptation | "No adaptation data available." |
| ExerciseLibraryPage | No search results | Filtered empty state |
| AskPage | No prior sessions | Suggested questions grid shown |

---

## APPENDIX D — ALL ERROR STATES

| Screen/Action | Error Condition | Treatment |
|---|---|---|
| LoginPage | Wrong credentials | Inline error below form |
| LoginPage | Unconfirmed email | Inline warning with resend option |
| AuthCallbackPage | Link expired / 6s timeout | "Link expired or invalid" screen + /login link |
| ResetPasswordPage | Weak password | Inline validation error |
| WorkoutCompleteModal | Adaptation API fails | Silent — tab shows "No adaptation data" |
| useWorkoutSession | Supabase sync fails | Toast: "Workout saved locally, but cloud sync failed" |
| ProgramGeneration | API error | `genStatus='error'` — no Dashboard UI (R3) |
| api/ask | Rate limited (429) | Unclear client handling — needs verification |
| ProfilePage | Avatar upload > 5MB | Inline validation error |
| ProfilePage | Avatar upload fails | Toast error |
| AskPage | 403 status | Upgrade prompt + /subscription link |
| InsightsPage | No history in last 4 weeks | "Not enough data" inline message |

---

## APPENDIX E — ALL TOASTS, BANNERS, AND SUCCESS MESSAGES

### Toasts (via ToastContext)

| Trigger | Message | Type |
|---|---|---|
| Supabase sync fail (workout) | "Workout saved locally, but cloud sync failed. It will retry on next login." | error |
| Avatar upload success | Success confirmation | success |
| Avatar > 5MB | Validation message | error |
| API errors (various) | Varies per endpoint | error |

### Banners

| Component | Condition | Content |
|---|---|---|
| GuestBanner | `user.isGuest === true` | "Guest mode — data saved on this device only" + "Save progress" button |
| DashboardPage emerald banner | `genStatus='ready'` | "Your personalized program is ready!" + "View ->" |
| DashboardPage amber warning | `week >= 4` | "Consider a deload week" + "Ask Omnexus ->" |
| DashboardPage brand card | `genStatus='generating'` | "Building your training program..." + progress bar |
| DashboardPage alert card | `activeSession` exists | "Workout in progress" + "Resume" button |
| ChallengesPage | Pending invitation | Invitation banner with accept/decline |

---

## APPENDIX F — ALL MODALS / DIALOGS / CONFIRMATION FLOWS

| Modal | Trigger | Content | Dismissible |
|---|---|---|---|
| WorkoutCompleteModal | `completeWorkout()` call | Summary + Next Session tabs | No (navigate only) |
| ShareCardModal | "Share your PR" button | Canvas preview + download | Yes (X button) |
| ExercisePickerSheet | "Add Exercise" in workout | Exercise browser | Yes |
| RestTimer bottom-sheet | Set completed | Countdown timer | Yes |
| ConfirmDialog (discard) | "Discard workout" button | "Are you sure?" | Yes |
| ConfirmDialog (delete account) | ProfilePage Danger Zone | "This is permanent" | Yes |
| Add Food modal (Nutrition) | "+ Add Food" | Food entry form | Yes |
| AI Meal Plan modal (Nutrition) | "AI Meal Plan" | Generated plan display | Yes |
| Create Challenge modal | ChallengesPage | Challenge configuration | Yes |
| FriendPicker (inline) | "Invite friends" in challenge | Friend search + select | Yes |
| YouTube embed (ExerciseDetail) | "Watch Demo" | Lazy YouTube iframe | Yes |
| Exercise Demo bottom-sheet | Play icon in ExerciseBlock (workout) | YouTube embed | Yes |

---

## APPENDIX G — FIRST-TIME vs. RETURNING USER LOGIC

| Condition | First-Time | Returning |
|---|---|---|
| No `fit_user` in localStorage | -> /onboarding or /guest | — |
| `omnexus_tutorial_seen` absent | AppTutorial shown (auth only) | AppTutorial skipped |
| `genStatus='generating'` on first load | Spinner card on Dashboard | resumeIfNeeded() restores |
| No `activeProgramId` | "Get Started" card | TodayCard with program |
| No history sessions | Empty streak, empty heatmap | Streak + heatmap populated |
| No `omnexus_last_adaptation` | InsightsPage empty | InsightsPage with analysis |
| First lesson visit | Progress = 0% | Progress shows completion |
| First community visit | Empty feed (R17 risk) | Feed with friend activity |

---

## APPENDIX H — STATE PERSISTENCE

| Data | Storage | Sync to Supabase? |
|---|---|---|
| User profile | `fit_user` localStorage | Yes (profiles table) |
| Workout history | `fit_history` localStorage | Yes (sessions table) |
| Active session | `fit_active_session` localStorage | No (transient) |
| Theme preference | `fit_theme` localStorage | No |
| Program week/day cursor | `fit_program_week_cursor` / `fit_program_day_cursor` | No |
| Learning progress | `omnexus_learning_progress` localStorage | Yes (debounced 2s) |
| AI insight sessions | `omnexus_insight_sessions` localStorage | No |
| Article cache | `omnexus_article_cache` localStorage | No |
| Custom programs | `omnexus_custom_programs` localStorage | Partial (active_program_id synced) |
| Guest flag | `omnexus_guest` localStorage | No |
| Nutrition goals | `omnexus_nutrition_goals` localStorage | No |
| Program generation state | `omnexus_program_generation` localStorage | No |
| Tutorial seen flag | `omnexus_tutorial_seen` localStorage | No |
| Last adaptation | `omnexus_last_adaptation` localStorage | No |
| Personal records | `fit_personal_records` localStorage | Yes (personal_records table) |
| Measurements | `omnexus_measurements` localStorage | No |
| Avatar URL | `user.avatarUrl` in `fit_user` | Yes (Supabase Storage + profiles) |

---

## APPENDIX I — TUTORIAL / ONBOARDING DISPLAY RULES

| Rule | Condition |
|---|---|
| AppTutorial shown | `state.user` is truthy AND `!state.user.isGuest` AND `!localStorage.omnexus_tutorial_seen` |
| AppTutorial hidden | Guest user, OR tutorial already seen |
| AppTutorial dismissed | Sets `omnexus_tutorial_seen = 'true'` in localStorage |
| OnboardingChat shown | New auth user navigating to /onboarding |
| ProfileSummaryCard shown | After AI profile collected; displays aiSummary + generating animation |
| GuestSetupPage shown | User navigating to /guest (no auth) |
| Guest upgrade prompt | GuestBanner "Save progress" CTA (persistent) |
| Deload warning shown | `week >= 4` on any program, on DashboardPage |

---

## APPENDIX J — FEATURE INVENTORY

| Feature | Status | Auth Required | AI? | Cloud Sync? |
|---|---|---|---|---|
| AI Onboarding (9-step chat) | Live | No (during signup) | Yes | Yes |
| AI Program Generation (8-week) | Live | No (async post-signup) | Yes | Partial |
| Guest Mode | Live | No | No | No |
| Active Workout Tracker | Live | Guest OK | No | Yes (auth) |
| PR Detection + Confetti | Live | Guest OK | No | Yes (auth) |
| Rest Timer | Live | Guest OK | No | No |
| Pre-Workout AI Briefing | Live | Guest OK | Yes | No |
| AI Adaptation (Next Session) | Live | Auth only | Yes | Partial |
| Custom Program Builder | Live | Guest OK | No | Partial |
| Exercise Library (51 exercises) | Live | Guest OK | No | No |
| YouTube Exercise Demos | Live | Guest OK | No | No |
| Workout History + Calendar | Live | Guest OK | No | Yes (auth) |
| Streak Tracking | Live | Guest OK | No | No |
| Muscle Heatmap | Live | Guest OK | No | No |
| Recovery Score | Live | Guest OK | No | No |
| AI Insights (post-workout) | Live | Auth only | Yes | No |
| AI Ask (RAG chat) | Live | Guest OK | Yes | No |
| Learning Courses + Lessons | Live | Guest OK | Yes (micro-lesson) | Yes (auth) |
| Nutrition Tracker | Live | Guest OK | Yes (meal plan) | No |
| Body Measurements | Live | Guest OK | No | No |
| Plate Calculator | Live | Guest OK | No | No |
| Activity Feed | Live | Auth only | No | Yes |
| Friends System | Live | Auth only | No | Yes |
| Leaderboard | Live | Auth only | No | Yes |
| Challenges (solo + co-op) | Live | Auth only | No | Yes |
| Block Mission Progress | Live | Auth only | No | Yes |
| Profile Picture Upload | Live | Auth only | No | Yes |
| Dark/Light Mode | Live | Guest OK | No | No |
| Share PR Card (Canvas) | Live | Guest OK | No | No |
| Push Notifications (toggle) | UI only | Auth only | No | No |
| Data Export (JSON) | Live | Auth only | No | No |
| Subscription / Stripe | UI only | Auth only | No | Yes |
| Wearables / HealthKit | Code exists, disabled | Auth only | No | No |
| Haptic Feedback | Native only | Guest OK | No | No |
| Analytics (PostHog) | Live | Guest OK (anon) | No | No |

---

*End of Omnexus Product Audit — 8 sections + 10 appendices*
