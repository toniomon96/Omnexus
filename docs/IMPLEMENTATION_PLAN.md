# Omnexus — Multi-Epic, Multi-Sprint Implementation Plan

This document consolidates the specifications from `docs/exercise-library.md`, `docs/learning-system.md`, `docs/gamification.md`, `docs/ai-coach.md`, and `docs/program-continuation.md` into a structured execution plan: five epics, ten sprints (A–J).

---

## Planning Principles

- Each epic is a self-contained product capability. Epics are designed to ship incrementally — no epic requires another to be complete before its first sprint can begin.
- Sprints within an epic are sequenced by dependency. Sprint A must complete before Sprint B in the same epic. Cross-epic sprint dependencies are called out explicitly.
- Every sprint closes with a working vertical slice: database migration, API change, UI, and test coverage shipped together.
- No sprint closes without all three gates green: local verify, CI green, and manual product QA.

---

## Epic Overview

| Epic | Name | Sprints | Summary |
|---|---|---|---|
| **Epic 1** | Exercise Library | A, B, I | Expand 61 → 300 exercises, redesign Exercise Detail Page, build the Exercise Discovery Engine |
| **Epic 2** | Gamification Engine | C, D (partial), F (partial), J | XP system, ranks, streaks, Sparks, achievements, celebration animations |
| **Epic 3** | Learning System | C (partial), D, E, F | Five course categories, quiz engine, spaced repetition, social learning |
| **Epic 4** | AI Coach — Omni | G | Evolve Ask page into Omni with three operating modes, Check-In pipeline, Coach Notes |
| **Epic 5** | Program Continuation | H | Progression Report, three continuation options, program chaining, Training DNA |

---

## Sprint Schedule

Sprints run sequentially unless explicitly noted as parallel. Sprints C, D, and F each cover scope from two epics: the work is coordinated within the same two-week window by the same team rather than run as independent parallel tracks. The total estimated sequential timeline is **20 weeks**.

| Sprint | Epic(s) | Duration | Theme |
|---|---|---|---|
| **Sprint A** | Epic 1 | 2 weeks | Exercise data expansion to 150 |
| **Sprint B** | Epic 1 | 2 weeks | Exercise data to 300 + Exercise Detail Page |
| **Sprint C** | Epic 2 + Epic 3 | 2 weeks | Gamification foundation + learning database |
| **Sprint D** | Epic 2 + Epic 3 | 2 weeks | First courses + quiz engine + daily challenge |
| **Sprint E** | Epic 3 | 2 weeks | Remaining course content + spaced repetition |
| **Sprint F** | Epic 2 + Epic 3 | 2 weeks | Social learning + weekly XP leaderboard |
| **Sprint G** | Epic 4 | 2 weeks | Omni AI coach — all three modes |
| **Sprint J** | Epic 2 | 1 week | Celebration animations + share card generator |
| **Sprint H** | Epic 5 | 2 weeks | Program Continuation + Training DNA |
| **Sprint I** | Epic 1 | 2 weeks | Exercise Discovery Engine |

> **Sequencing note:** Sprint J (1 week) runs before Sprint H (2 weeks) because the Progression Report share button in Sprint H depends on the share card generator built in Sprint J. Sprint I runs last because the Discovery Engine only requires the Sprint B exercise dataset to be complete.

---

## Epic 1 — Exercise Library

**Goal:** Grow the exercise database from 61 to 300 exercises, deliver a best-in-class Exercise Detail Page, and build an intelligent exercise discovery experience.

**Source document:** `docs/exercise-library.md`

### Sprint A — Exercise Data Expansion (150 Exercises)

**Duration:** 2 weeks

**Goal:** Add 90 new exercises to reach a total of 150. Expand the TypeScript type system to support the full 300-exercise schema.

**Deliverables:**

- Expand `MuscleGroup` type to include all 23 muscle groups defined in `docs/exercise-library.md`:
  `quads`, `hamstrings`, `glutes`, `calves`, `adductors`, `abductors`, `hip-flexors`, `tibialis`, `chest`, `front-deltoid`, `side-deltoid`, `rear-deltoid`, `rotator-cuff`, `triceps`, `biceps`, `forearms`, `lats`, `traps`, `rhomboids`, `serratus`, `erectors`, `abs`, `obliques`
- Expand `Equipment` type to include all 16 equipment types.
- Add `progressionPath.easier` and `progressionPath.harder` fields to the exercise schema.
- Add `tags` and `popularityScore` fields to the exercise schema.
- Add `exerciseVariants` array for automatic equipment swap resolution.
- Populate `src/data/exercises/barbell.ts` — 45 barbell exercises (10 squat, 10 hinge, 7 horizontal push, 5 horizontal pull, 3 vertical push, 2 vertical pull, 8 isolation).
- Populate `src/data/exercises/dumbbell.ts` — 55 dumbbell exercises.
- Populate `src/data/exercises/bodyweight.ts` — 45 bodyweight exercises.

**Scope excluded this sprint:** Cable, machine, kettlebell, EZ bar, resistance band, TRX, mobility. Those land in Sprint B.

**Acceptance criteria:**
- `src/data/exercises/index.ts` exports a merged `EXERCISE_LIBRARY` constant with ≥ 150 entries.
- All new exercises have `steps`, `commonMistakes`, `coachingCues`, `proTips`, `progressionPath`, and `difficulty` populated.
- TypeScript compiles with 0 errors (`npm run build`).
- ESLint passes with 0 warnings.
- Existing unit tests remain green.

**Exit criteria:**
- Total exercise count ≥ 150 confirmed in `EXERCISE_LIBRARY`.
- New `MuscleGroup` and `Equipment` types are fully adopted across the codebase with no `any` escapes.

---

### Sprint B — Exercise Data to 300 + Exercise Detail Page

**Duration:** 2 weeks

**Goal:** Complete the 300-exercise target. Redesign the `ExerciseDetailPage` into the full tabbed experience described in the spec.

**Deliverables:**

- Populate remaining exercise files:
  - `src/data/exercises/cable.ts` — 35 cable machine exercises
  - `src/data/exercises/machine.ts` — 30 machine exercises
  - `src/data/exercises/kettlebell.ts` — 25 kettlebell exercises
  - `src/data/exercises/ez-bar.ts` — 10 EZ bar exercises
  - `src/data/exercises/resistance-band.ts` — 20 resistance band exercises
  - `src/data/exercises/trx.ts` — 15 TRX/suspension exercises
  - `src/data/exercises/mobility.ts` — 20 mobility and flexibility exercises
- Expand `EXERCISE_YOUTUBE_IDS` map to cover all 300 exercises with YouTube demo links.
- Redesign `ExerciseDetailPage`:
  - Full-width lazy-loaded YouTube demo video section at top.
  - Four-tab interface below: **How To** · **Common Mistakes** · **Variations** · **Coach Cues**.
  - **Equipment Substitute Finder** — three alternatives when user taps "Can't do this."
  - **Difficulty Badge** — visual indicator (1–5).
  - **Muscle Activation Summary** — text-based primary/secondary muscle display.
  - **Personal Best** — user's best recorded set from workout history.
  - **Related Exercises** — same movement pattern.
  - **Movement Pattern Library Button** — links to pattern browser (to be built in Sprint I).

**Acceptance criteria:**
- `EXERCISE_LIBRARY` total count = 300.
- All equipment categories represented in the correct file under `src/data/exercises/`.
- `ExerciseDetailPage` renders all four tabs with correct data sourced from the exercise schema.
- Equipment Substitute Finder returns three alternatives by traversing `exerciseVariants`.
- YouTube embeds lazy-load (no blocking main thread on page mount).
- TypeScript and ESLint gates pass.

**Exit criteria:**
- Manual QA confirms the redesigned `ExerciseDetailPage` on both desktop and mobile breakpoints.
- 300 exercises confirmed in `EXERCISE_LIBRARY`.

---

### Sprint I — Exercise Discovery Engine

**Duration:** 2 weeks

**Goal:** Replace the flat exercise list with an intelligent multi-mode discovery experience.

**Cross-epic dependency:** Sprint B must be complete (full 300-exercise dataset needed for all filters).

**Deliverables:**

- **Browse by Movement Pattern** — all exercises grouped by `movementPattern`. Nine patterns: squat, hinge, push-horizontal, push-vertical, pull-horizontal, pull-vertical, isolation, carry, cardio.
- **Browse by Muscle** — visual muscle map (text-based v1; SVG anatomical map deferred to v2). Tapping a muscle reveals all exercises with that muscle in `primaryMuscles` or `secondaryMuscles`.
- **Browse by Equipment** — exercises filtered to the user's saved equipment profile from onboarding. Automatically excludes exercises requiring equipment the user does not have.
- **Browse by Difficulty** — filter slider 1–5 with descriptions (1: Beginner, 5: Elite).
- **Natural Language Search** — semantic search using existing RAG infrastructure (`/api/ask` with exercise context). User types natural language queries (e.g., "upper back with no barbell") and receives semantically ranked results.
- **Equipment Swap Recommendation Feature** — surfaces from `ExerciseDetailPage` (built in Sprint B); confirmed working end-to-end in this sprint.

**Acceptance criteria:**
- All five browse modes are reachable from the exercise library entry point.
- Equipment filter respects the user's onboarding equipment profile.
- Natural language search returns relevant results and falls back gracefully if the API is unavailable.
- Difficulty filter updates results without a page reload.
- TypeScript and ESLint gates pass.

**Exit criteria:**
- Manual QA of all five discovery modes on mobile viewport.
- Natural language search tested with at least five representative queries.

---

## Epic 2 — Gamification Engine

**Goal:** Build the full XP and engagement system — ranks, streaks, Sparks currency, achievements, and the celebration mechanics that make progress feel rewarding.

**Source document:** `docs/gamification.md`

### Sprint C — Gamification Foundation

**Duration:** 2 weeks (runs concurrently with Epic 3's Sprint C scope)

**Goal:** Create all database tables, build the XP event system in `AppContext`, implement the rank system, and wire XP rewards to existing actions.

**Deliverables:**

- Create six Supabase tables:
  ```sql
  user_xp           -- total_xp, current_rank, weekly_xp, weekly_xp_resets_at
  learning_streaks  -- current_streak, longest_streak, last_lesson_date, freeze_tokens
  achievements      -- id, name, description, tier, xp_reward, icon_name (static catalogue)
  user_achievements -- user_id + achievement_id + earned_at
  user_sparks       -- total_sparks, earned_lifetime, spent_lifetime
  xp_events         -- append-only log: user_id, event_type, xp_amount, description, created_at
  ```
- Seed the `achievements` table with the full catalogue from `docs/gamification.md`:
  - 6 Bronze tier entries, 6 Silver tier entries, 6 Gold tier entries.
- Extend `AppContext` reducer with:
  - Optimistic XP update on client before server sync.
  - Rank threshold check — fires `RANK_UP` action when `total_xp` crosses a rank boundary.
  - Streak increment on lesson completion.
  - Achievement unlock check after every XP event.
  - Sparks balance update on earn/spend.
- Wire XP rewards to existing actions:
  - Workout completion: +25 XP
  - PR celebration: +15 XP (existing confetti mechanic extended)
  - Lesson completion: +10 XP — the `LESSON_COMPLETED` reducer action and `xp_events` write path are defined in this sprint; the trigger fires from the lesson reader component built in Sprint D.
- Build rank badge component — displays current rank name and icon on Profile page.
- Build streak counter component — displayed in app header/navigation, never hidden.
- **Sync strategy:** Optimistic update on client → async write to `xp_events` and `user_xp` → reconcile on next app load.

**`XpEventType` type definition:**
```typescript
type XpEventType =
  | 'lesson_completed'
  | 'quiz_perfect'
  | 'module_completed'
  | 'course_completed'
  | 'workout_completed'
  | 'nutrition_logged'
  | 'personal_record'
  | 'daily_challenge'
  | 'checkpoint_correct'
  | 'achievement_unlock'
  | 'battle_won'
  | 'battle_participated'
```

**Rank threshold table (from `docs/gamification.md`):**

| Rank | Name | XP Range |
|---|---|---|
| 1 | Recruit | 0 – 499 |
| 2 | Trainee | 500 – 1,499 |
| 3 | Athlete | 1,500 – 3,499 |
| 4 | Competitor | 3,500 – 6,999 |
| 5 | Elite | 7,000 – 11,999 |
| 6 | Coach | 12,000 – 19,999 |
| 7 | Master | 20,000 – 34,999 |
| 8 | Legend | 35,000+ |

**Acceptance criteria:**
- All six database tables created via migration files in `docs/migrations/`.
- `AppContext` reducer correctly computes rank from `total_xp` with no off-by-one at thresholds.
- XP events are written to `xp_events` for workout completion and PR actions.
- Streak counter increments on lesson completion and resets correctly on a missed day.
- Rank badge component renders the correct rank name and badge for all 8 ranks.
- Unit tests cover rank threshold logic and XP optimistic update reducer.

**Exit criteria:**
- Gamification state visible on Profile page (rank badge + streak counter).
- XP is logged in `xp_events` for workout and PR actions confirmed via Supabase dashboard.

---

### Sprint D — Combo Multiplier, Daily Challenge, and Sparks Earning

**Duration:** 2 weeks (runs after Sprint C; shares sprint with Epic 3 Sprint D content)

**Goal:** Add the combo multiplier to the quiz engine, build the Daily Lesson Challenge feature, and wire Sparks earning for course completion.

**Cross-epic dependency:** Epic 3 Sprint D (quiz engine) must be in progress or complete.

**Deliverables:**

- **Combo multiplier** in quiz engine:
  - Visual combo counter displayed during a quiz session.
  - XP multiplier applied to quiz XP only:
    - 3 in a row → 1.25×
    - 5 in a row → 1.5×
    - 10 in a row → 2.0×
  - Breaking the combo resets to 1×.
- **Daily Lesson Challenge:**
  - `daily_challenges` table: `lesson_id`, `challenge_date` (one row per day).
  - Midnight UTC rotation — a scheduled function selects one lesson per day.
  - Challenge indicator displayed prominently on the Learn tab home screen.
  - Completing the featured lesson that day awards 30 XP (triple XP) instead of 10 XP.
  - Same challenge for all users.
- **Sparks earning triggers:**
  - 7-day streak completion: +10 Sparks
  - Full course completion: +25 Sparks
  - Premium subscribers: double Sparks on all above
- **Weekly XP leaderboard reset:** `weekly_xp` in `user_xp` resets to 0 every Monday at 00:00 UTC. Historical weekly XP remains queryable from `xp_events`.

**Acceptance criteria:**
- Combo counter resets correctly when a question is answered incorrectly.
- Multiplied XP is written to `xp_events` with the correct `xp_amount`.
- Daily challenge rotates at midnight UTC (testable with a mocked date).
- Triple XP is awarded only when the challenge lesson is completed on the correct calendar date.
- Sparks balance updates in `user_sparks` after a 7-day streak and course completion.

**Exit criteria:**
- Combo multiplier visible and functional during a quiz session.
- Daily Challenge card visible on Learn tab home screen with correct lesson indicated.

---

### Sprint F (partial) — Weekly XP Leaderboard and Knowledge Battle XP

**Duration:** 2 weeks (shares sprint with Epic 3 Sprint F social learning scope)

**Goal:** Wire gamification events to social learning features. Build the weekly XP leaderboard.

**Cross-epic dependency:** Epic 3 Sprint F (Study Groups, Knowledge Battles) must be in progress.

**Deliverables:**

- **Weekly XP leaderboard** — friends leaderboard showing XP earned in the current week.
  - Resets every Monday at 00:00 UTC.
  - Top 3 users earn special profile decorations for the week.
  - Leaderboard is specifically for **learning engagement** (separate from the workout leaderboard).
- **Knowledge Battle XP flow:**
  - Winner earns XP from the loser (exact amounts defined in `docs/gamification.md`).
  - Loser earns a smaller consolation XP prize.
  - Both events written to `xp_events` on battle completion.
- **Teach It Back Sparks rewards:**
  - High-rated Teach It Back contribution awards 5 Sparks.
  - Rating threshold for "high-rated" to be confirmed with product owner.
- **Study Group XP:**
  - Completing the weekly group challenge gives every member a bonus XP reward.

**Acceptance criteria:**
- Weekly leaderboard correctly displays friends sorted by `weekly_xp`.
- Battle XP events written to `xp_events` with correct `event_type: 'battle_won'` and `'battle_participated'`.
- Teach It Back Sparks awarded only when contribution meets the rating threshold.

---

### Sprint J — Celebration Animations and Share Cards

**Duration:** 1 week

**Goal:** Build all celebration mechanics and the share card generator. This is a visual/animation-only sprint — no new data models.

**Cross-epic dependency:** All gamification events (rank-up, perfect quiz, streak milestones, achievements, course completion) must be firing correctly from Sprints C–F.

**Deliverables:**

- **Rank-up full-screen celebration:** Animated full-screen overlay with new rank badge, confetti burst, and summary of what unlocked. Fires when `RANK_UP` action is dispatched in `AppContext`.
- **Perfect quiz gold flash:** Screen flashes gold briefly. 2× XP bonus displayed. Combo counter animates to new total.
- **Streak milestone full-screen celebration:** Full-screen moment with streak number displayed large. Triggers at 7, 30, 100, and 365 days.
- **Achievement toast:** Toast notification rises from bottom with achievement icon, name, and XP reward. Tapping opens full achievement detail screen.
- **Personal record:** Existing confetti mechanic extended with XP award overlay.
- **Course completion certificate screen:** Certificate-style screen with course name, completion date, and share button. Certificate stored in user profile.
- **Share card generator:** Generates a shareable image (PNG) for streak milestones, course completions, and the Progression Report (used by Epic 5 Sprint H). Cards are autogenerated with no manual design step per-user.

**Design principle:** The rest of the UI is calm and premium — celebrations must feel special, not constant noise.

**Acceptance criteria:**
- Rank-up celebration fires exactly once per rank threshold crossing.
- Celebration components do not fire on app reload if the event has already been seen.
- Share card generator produces a valid PNG for streak milestones and course completions.
- Achievement toast auto-dismisses after 4 seconds; tap opens full detail.
- All animations respect the user's system `prefers-reduced-motion` setting.

**Exit criteria:**
- Manual QA of all six celebration types in sequence.
- Share card PNG tested on iOS and Android share sheet.

---

## Epic 3 — Learning System

**Goal:** Build five categories of educational courses with interactive lesson format, a full quiz engine with spaced repetition, and social learning features.

**Source document:** `docs/learning-system.md`

### Sprint C (partial) — Database Foundation for Learning

**Duration:** Runs within Sprint C (same 2-week sprint as Epic 2 Sprint C)

**Goal:** Create the learning-specific database tables needed by all subsequent learning sprints.

**Deliverables:**

- Create learning-specific tables (included in the same migration as Epic 2 Sprint C):
  ```sql
  learning_battles        -- sender_id, receiver_id, topic, scores, outcome, timestamps
  learning_review_queue   -- user_id, lesson_id, concept_id, next_review, ease_factor, interval_days, review_count
  ```
- Create `src/data/courses/` directory with the 20 JSON course files (empty scaffolds):
  ```
  foundations-how-body-gets-stronger.json
  foundations-understanding-your-program.json
  foundations-beginner-movement-mastery.json
  nutrition-fundamentals.json
  nutrition-eating-for-goal.json
  nutrition-practical-habits.json
  nutrition-supplements.json
  science-hypertrophy.json
  science-strength-development.json
  science-fat-loss.json
  science-recovery-adaptation.json
  science-program-design.json
  technique-squat-mastery.json
  technique-deadlift-mastery.json
  technique-bench-press-mastery.json
  technique-overhead-press-mastery.json
  technique-pullup-row-mastery.json
  mind-training-psychology.json
  mind-injury-prevention.json
  mind-goal-setting.json
  ```
- Define the Course JSON schema (`id`, `title`, `category`, `description`, `modules[]`, `assessment`) as a TypeScript interface in `src/types/course.ts`.

**Acceptance criteria:**
- `learning_battles` and `learning_review_queue` tables created via migration.
- `src/types/course.ts` TypeScript interface compiles cleanly.
- All 20 JSON scaffold files present with valid schema structure (content TBD in Sprints D–E).

---

### Sprint D — First Courses and Quiz Engine

**Duration:** 2 weeks

**Goal:** Ship the first playable courses (Foundations and Nutrition Fundamentals) with the full lesson reader and quiz engine.

**Deliverables:**

- **Course content (JSON):**
  - `foundations-how-body-gets-stronger.json` — fully populated with all modules and lessons.
  - `foundations-understanding-your-program.json` — fully populated.
  - `foundations-beginner-movement-mastery.json` — fully populated.
  - `nutrition-fundamentals.json` — fully populated.

- **Lesson reader component** — implements all five lesson sections:
  1. **Hook** — bold opening statement.
  2. **Knowledge Block** — 2–4 paragraphs, jargon-free.
  3. **Interactive Checkpoint** — single-question mid-lesson check; never blocks progress; awards 2 XP on correct answer.
  4. **Key Takeaways** — bullet list of 3 concepts; fed into spaced repetition system.
  5. **Real World Application** — single actionable instruction.
  6. **Share Card** (optional) — lesson topic + key quote, shareable to social.

- **Quiz engine** — supports four question types:
  - Multiple choice (4 options)
  - True or False (with one-sentence reason shown after answer)
  - Fill in the blank (select missing word from 3 options)
  - Order the steps (tap to reorder)
  - *(Image question deferred to future phase)*
- **Failed quiz recovery:** Users below 70% see weak-point lessons highlighted and are offered a Quick Retry with 3 targeted questions before the full quiz.
- **Combo multiplier** wired to quiz engine (described in Epic 2 Sprint D).
- **Learning Path routing** for Paths A and B:
  - **Path A — Beginner Foundation:** For `trainingAgeYears === 0`
  - **Path B — Hypertrophy Specialist:** For `goal === 'hypertrophy'`

**Acceptance criteria:**
- All four Foundations and Nutrition course JSONs are fully populated with modules, lessons, and quizzes.
- Lesson reader renders all five sections in sequence.
- Interactive checkpoint awards 2 XP and does not block progress on incorrect answer.
- Quiz engine passes all question types in a single session.
- Failed quiz recovery surfaces correctly when score < 70%.
- XP is awarded at lesson completion (+10), perfect quiz (+20), module completion (+50), and course completion (+200).
- Learning path routing sends new users to Path A on first open.

**Exit criteria:**
- Manual QA of a full end-to-end lesson → quiz → XP reward flow.
- Course completion XP event confirmed in `xp_events` via Supabase dashboard.

---

### Sprint E — All Remaining Courses, Spaced Repetition, Learning Paths

**Duration:** 2 weeks

**Goal:** Complete all 20 courses across Exercise Science, Movement Mastery, and Mind & Performance categories. Build the spaced repetition review session and all five learning paths.

**Deliverables:**

- **Course content (JSON):** Populate all remaining 16 course JSON files:
  - Nutrition: `nutrition-eating-for-goal.json`, `nutrition-practical-habits.json`, `nutrition-supplements.json`
  - Exercise Science: `science-hypertrophy.json`, `science-strength-development.json`, `science-fat-loss.json`, `science-recovery-adaptation.json`, `science-program-design.json`
  - Technique: `technique-squat-mastery.json`, `technique-deadlift-mastery.json`, `technique-bench-press-mastery.json`, `technique-overhead-press-mastery.json`, `technique-pullup-row-mastery.json`
  - Mind: `mind-training-psychology.json`, `mind-injury-prevention.json`, `mind-goal-setting.json`

- **Spaced repetition review session** — implemented in `src/services/spacedRepetition.ts`:
  - SM-2/Anki algorithm: ease factor starts at 2.5; correct → interval × ease factor; incorrect → reset to 1 day.
  - Daily Review session: 5–10 flashcard-style questions from previously completed content.
  - Session takes 3–5 minutes.
  - Key Takeaways from completed lessons are the flashcard content.
  - State persisted in `learning_review_queue`.

- **Course completion certificate screen** (also referenced in Epic 2 Sprint J):
  - Certificate-style screen: course name, completion date, share button.
  - Certificate stored in user profile.

- **Complete Learning Path routing** for Paths C, D, E:
  - **Path C — Fat Loss:** For `goal === 'fat-loss'`
  - **Path D — Strength:** For intermediate/advanced users with strength goal
  - **Path E — Longevity:** For `goal === 'general-fitness'` or older athletes

**Acceptance criteria:**
- All 20 course JSON files fully populated with correct schema.
- Spaced repetition session surfaces Key Takeaways from completed lessons at the correct review interval.
- Correct answer extends review interval; incorrect answer resets to 1 day.
- All five learning paths route users to the correct course sequence based on onboarding data.
- TypeScript and ESLint gates pass.

**Exit criteria:**
- Full course playthrough from start to completion tested for at least one Exercise Science and one Technique course.
- Spaced repetition queue contains entries after lesson completion confirmed via Supabase dashboard.

---

### Sprint F — Social Learning

**Duration:** 2 weeks

**Goal:** Build Study Groups, Knowledge Battles, and Teach It Back. Wire the weekly XP leaderboard (shared with Epic 2 Sprint F).

**Deliverables:**

- **Study Groups:**
  - Create or join a group of up to 10 users.
  - Groups display a shared weekly XP total.
  - Weekly group challenge (e.g., "complete 5 lessons this week collectively").
  - Completing the group challenge awards every member a bonus XP reward.
  - State persisted in `study_groups` and `study_group_members` tables.

- **Knowledge Battles:**
  - Two friends challenge each other to a timed 10-question quiz on a topic of their choice.
  - Winner earns XP; loser earns consolation XP.
  - Only initiatable between confirmed friends.
  - State tracked in `learning_battles` table (created in Sprint C).

- **Teach It Back:**
  - After course completion, user unlocks ability to write a brief explanation in their own words.
  - Other users can rate the explanation as helpful.
  - High-rated contributions earn 5 Sparks and are featured in community section.

- **Weekly XP leaderboard** (shared with Epic 2 Sprint F scope — see above).

**Acceptance criteria:**
- Study Groups can be created and joined. Group weekly XP total updates correctly when a member earns XP.
- Knowledge Battle completes with correct winner/loser XP assignment.
- Teach It Back contribution is submittable after course completion only.
- High-rated Teach It Back contributions surface in the community section.

**Exit criteria:**
- Knowledge Battle end-to-end tested with two test accounts.
- Manual QA of Study Group weekly challenge reward flow.

---

## Epic 4 — AI Coach (Omni)

**Goal:** Evolve the current Ask Omnexus page into Omni — a named AI coach with a defined personality and three operating modes. Build the Check-In data pipeline and the Coach Notes generation system.

**Source document:** `docs/ai-coach.md`

### Sprint G — Omni AI Coach

**Duration:** 2 weeks

**Goal:** Deliver the complete Omni experience: persona, three modes, Check-In data pipeline, adaptation engine integration, and Coach Notes.

**Deliverables:**

- **Omni UI — Ask page evolution:**
  - Rename "Ask Omnexus" to "Ask Omni" with Omni's name and avatar displayed.
  - Three mode buttons in the Ask page header: **Coach** · **Science** · **Check-In**.
  - Mode selection persists within the session (not across sessions).

- **Mode-specific system prompt logic:**
  - **Coach Mode:** System prompt includes user's current program, recent workout history (last 3–5 sessions), PRs, rank, and streak. Responses capped at 150 words unless user requests more detail. References Coach Notes from the active program week.
  - **Science Mode:** Routes to `/api/ask` with `mode: 'science'`. RAG pipeline retrieves relevant chunks from `documents` table. Response includes citation cards using existing citation display component.
  - **Check-In Mode:** Omni asks 2–3 short questions (energy level 1–10, sleep quality, soreness/pain flag). Conversation kept under 2 minutes. One-sentence training recommendation generated from responses. Data written to `daily_checkins` table.

- **`daily_checkins` table:**
  ```sql
  CREATE TABLE daily_checkins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users,
    checkin_date    DATE NOT NULL,
    energy_level    INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    sleep_quality   INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    soreness_level  INTEGER CHECK (soreness_level BETWEEN 1 AND 5),
    pain_flag       BOOLEAN NOT NULL DEFAULT FALSE,
    pain_location   TEXT,
    notes           TEXT,
    omni_response   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

- **Adaptation engine integration for Check-In signals** (extends existing `/api/adapt`):
  - If `energy_level < 5` or `sleep_quality < 5`: apply RPE reduction modifier (−1 to −2 RPE) to that day's planned workout.
  - If `pain_flag === true`: flag affected exercises for swap and surface a confirmation prompt.
  - Adaptation suggestions appear as a banner at the top of the active workout screen: "Based on your check-in, Omni recommends reducing intensity today."

- **Coach Notes generation as part of the program generator:**
  - Notes generated when the program is first created by `/api/generate-program` — no separate live API call during the workout.
  - Each week's notes follow the theme defined in `docs/ai-coach.md`:

    | Week | Note Theme |
    |---|---|
    | 1–2 | Technique focus, learning the movements, don't push to failure |
    | 3 | High work accumulation, trust the process, technique over load |
    | 4 | Back off, let adaptations consolidate |
    | 5–6 | Loads are going up, manage fatigue, PR window opening |
    | 7 | Peak week, controlled aggression |
    | 8 | PR attempts, trust the preparation |

  - Notes are parameterized with: user's first name, current week number, training day label, and any adaptation flags from recent check-ins.

- **Smart Progressive Overload recommendation overlay** in active workout:
  - Displayed when the previous session's set data shows all reps completed at ≥ 2 RIR.
  - Omni recommends a specific weight increment based on the user's progression history.

**Omni system prompt structure:**
```
You are Omni, the AI coach for Omnexus. You are direct, knowledgeable, and encouraging without being sycophantic.

Current user context:
- Name: {firstName}
- Goal: {goal}
- Training age: {trainingAgeYears} years
- Current program: {programName}, Week {currentWeek} of 8, {split}
- Recent PRs: {recentPRs}
- Current rank: {rankName}
- Today's check-in: {checkInSummary | 'No check-in today'}

Operating mode: {mode}

Rules:
- Reference the user's data when relevant — do not give generic advice when specific advice is available.
- In coach mode, keep responses under 150 words unless the user asks for more detail.
- In science mode, cite sources from the RAG context provided.
- Never start with affirmations like "Great question!"
- Be honest about trade-offs and limitations.
```

**Acceptance criteria:**
- Three mode buttons are visible and functional on the Ask page.
- Coach Mode responses reference the user's actual program data (not generic advice).
- Science Mode responses include citation cards using the existing citation display component.
- Check-In Mode conversation completes in 3 exchanges and writes a record to `daily_checkins`.
- Adaptation banner appears on the active workout screen after a low-energy or low-sleep check-in.
- Coach Notes are included in the generated program structure for all 8 weeks.
- Smart overload overlay appears correctly when prior-session data qualifies.

**Exit criteria:**
- Manual QA of all three Omni modes in sequence.
- Check-In data confirmed in `daily_checkins` via Supabase dashboard.
- Adaptation banner displayed correctly after a simulated low-energy check-in.

---

## Epic 5 — Program Continuation

**Goal:** Turn the end-of-block moment into a powerful re-engagement event. Generate a personalized Progression Report and offer three structured continuation paths. Build the Training DNA profile visualization.

**Source document:** `docs/program-continuation.md`

### Sprint H — Progression Report, Continuation Options, and Training DNA

**Duration:** 2 weeks

**Goal:** Deliver the complete program continuation flow and the Training DNA profile page.

**Deliverables:**

- **Database migrations:**
  ```sql
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS predecessor_program_id UUID REFERENCES programs(id);
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS block_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (block_type IN ('standard', 'intensification', 'deload', 'custom'));
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS continuation_option TEXT
    CHECK (continuation_option IN ('build-on', 'change-focus', 'deload', NULL));

  CREATE TABLE progression_reports (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES auth.users,
    program_id           UUID REFERENCES programs(id),
    generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consistency_percent  NUMERIC(5,2),
    total_workouts       INTEGER,
    planned_workouts     INTEGER,
    top_prs              JSONB,
    volume_by_muscle     JSONB,
    omni_narrative       TEXT,
    viewed_at            TIMESTAMPTZ
  );

  CREATE VIEW program_chains AS
  SELECT
    p.id, p.user_id, p.name, p.block_type, p.continuation_option,
    p.predecessor_program_id, p.created_at, p.completed_at,
    predecessor.name AS predecessor_name,
    predecessor.completed_at AS predecessor_completed_at
  FROM programs p
  LEFT JOIN programs predecessor ON p.predecessor_program_id = predecessor.id;
  ```

- **Trigger condition:** After `workoutCompleted` event fires and the system detects `week === 8` AND `allDaysCompleted === true`, the continuation screen replaces the normal post-workout completion screen.

- **Progression Report screen** (full-screen, scrollable):
  1. **Header** — program name, date range, completion badge.
  2. **Consistency Ring** — circular progress indicator with percentage (e.g., "36 of 40 sessions — 90%").
  3. **Omni Narrative** — 2–4 sentence personalized summary, generated via single Claude API call. Displayed as a quote card with Omni's avatar.
  4. **Volume Bar Chart** — horizontal bars per muscle group sorted by total volume. Uses expanded `MuscleGroup` type.
  5. **PR List** — exercise name, PR weight, session date. Trophy icon for top 3.
  6. **Milestones** — rank-ups, achievements, streak milestones earned during the block.
  7. **Share Button** — generates a shareable image of the report summary (uses share card generator from Sprint J).
  8. **Continue Button** — scrolls to the three continuation options.

- **Omni narrative generation prompt:**
  ```
  Generate a 2–4 sentence personalized training block summary for {firstName}.

  Block data:
  - Program: {programName}
  - Duration: {startDate} to {endDate}
  - Consistency: {consistencyPercent}%
  - Top PRs: {topPRs}
  - Highest volume muscle group: {topMuscleGroup}
  - Notable week: {notableWeek}

  Tone: Direct, coach-like, specific to the numbers. No generic affirmations.
  ```

- **Three continuation options UI:**
  - **Option 1 — "Continue and intensify":** Reads the completed program's exercise selection and 1RM estimates. Increases working percentages by 5–10%, reduces volume slightly. Calls `/api/generate-program` with the continuation parameters and `blockType: 'intensification'`. Links new program via `predecessor_program_id`.
  - **Option 2 — "Change training goal":** Opens goal selection screen (pre-filled). User updates goal, split, equipment, days per week. Calls `/api/generate-program` with new parameters.
  - **Option 3 — "Take a deload week first":** Generates a single-week deload program at 50–60% working weight, 2–3 sets per exercise, no AMRAP. Tagged `blockType: 'deload'`. After deload completion, shows Options 1 and 2 again.

- **Body Transformation Timeline** (on Profile page):
  - Linked program blocks displayed as continuous segments.
  - Color by `block_type`: standard = Blue, intensification = Orange, deload = Green, custom = Purple.
  - Tapping a segment opens the Progression Report for that block.

- **Training DNA profile page** (five data visualizations):
  1. Dominant movement patterns from workout history.
  2. Strongest muscle groups by volume accumulated.
  3. Favorite learning course categories and knowledge strengths.
  4. Consistency pattern — which days of the week the user trains most.
  5. Progression rate — weight used on key lifts across time.
  - Training DNA recalculates weekly.

**Acceptance criteria:**
- Continuation screen appears after completing the final workout of an 8-week block (not before, not for mid-block completions).
- Progression Report calculates consistency, volume, PRs, and milestones correctly from workout history.
- Omni narrative is generated and written to `progression_reports.omni_narrative`.
- Option 1 generates a new intensification program linked to the predecessor.
- Option 3 generates a deload week tagged `blockType: 'deload'`, followed by the continuation screen again.
- Body Transformation Timeline shows colored segments for each linked block.
- Training DNA recalculates on the weekly schedule without manual trigger.

**Exit criteria:**
- Manual QA of the full end-to-end continuation flow (complete block → report → select option → new program loads).
- Progression Report confirmed in `progression_reports` table via Supabase dashboard.
- Training DNA profile page renders all five visualizations on mobile viewport.

---

## Cross-Epic Dependencies

| Dependent Sprint | Requires | Reason |
|---|---|---|
| Epic 3 Sprint D | Epic 2 Sprint C | XP events table must exist before lesson completion can award XP |
| Epic 3 Sprint E | Epic 3 Sprint D | Spaced repetition uses Key Takeaways populated in Sprint D courses |
| Epic 3 Sprint F | Epic 3 Sprint D | Knowledge Battles require quiz engine; Teach It Back requires course completion |
| Epic 2 Sprint D | (same sprint as Epic 3 Sprint D) | Combo multiplier is built as part of the quiz engine; both ship in the same Sprint D window |
| Epic 2 Sprint F | Epic 3 Sprint F | Weekly XP leaderboard and battle XP require social features; both ship in the same Sprint F window |
| Epic 2 Sprint J | Epic 2 Sprints C–F | Celebration animations require all gamification events to be firing |
| Epic 1 Sprint I | Epic 1 Sprint B | Discovery engine needs the full 300-exercise dataset |
| Epic 4 Sprint G | Epic 2 Sprint C | Omni references user rank and streak; tables must exist |
| Epic 5 Sprint H | Epic 4 Sprint G | Progression Report uses Omni for narrative generation |
| Epic 5 Sprint H | Epic 2 Sprint J | Progression Report share button uses the share card generator — Sprint J runs before Sprint H |

---

## Database Migrations Index

All migrations are created as numbered SQL files in `docs/migrations/`.

| Migration | Epic | Tables / Changes |
|---|---|---|
| 012_gamification_learning_foundation.sql | 2 + 3 | `user_xp`, `learning_streaks`, `achievements`, `user_achievements`, `user_sparks`, `xp_events`, `learning_battles`, `learning_review_queue` |
| 013_daily_challenges.sql | 2 | `daily_challenges` |
| 014_study_groups.sql | 3 | `study_groups`, `study_group_members` |
| 015_daily_checkins.sql | 4 | `daily_checkins` |
| 016_program_continuation.sql | 5 | `programs` ALTER (3 columns), `progression_reports`, `program_chains` VIEW |

---

## Metrics to Track Per Epic

### Epic 1 — Exercise Library
- Exercise detail page views per session
- "Can't do this exercise" tap rate (drives equipment swap usage)
- Natural language search query count and zero-result rate

### Epic 2 — Gamification
- Daily XP earned per active user
- Streak maintenance rate (7-day, 30-day)
- Rank distribution across user base
- Achievement unlock rate by tier (bronze / silver / gold)
- Sparks spend rate vs. earn rate

### Epic 3 — Learning System
- Daily active learners (lesson completions per day)
- Course completion rate per category
- Streak retention (7-day cohort comparison: with streak vs. without)
- Knowledge Battle acceptance rate
- Teach It Back contribution rate post-course completion

### Epic 4 — AI Coach (Omni)
- Check-In Mode completion rate
- Adaptation banner display rate
- Coach Mode vs. Science Mode vs. Check-In Mode usage split
- Omni response quality rating (thumbs up/down if surfaced)

### Epic 5 — Program Continuation
- Continuation flow trigger rate (users reaching block end / total users)
- Option selection distribution (build-on vs. change-focus vs. deload)
- Progression Report view rate and time-on-screen
- Second-block start rate (users who complete block 1 and begin block 2)
- Training DNA weekly active view rate

---

## Definition of Done (All Sprints)

A sprint is done only if all of the following are true:

- [ ] Code is merged via a PR to `main` following the branch model in `docs/ROADMAP.md`
- [ ] `npm run build` completes with 0 TypeScript errors
- [ ] `npm run lint` completes with 0 ESLint warnings
- [ ] All existing tests pass
- [ ] New unit tests written for new reducer logic, XP calculations, and algorithm code
- [ ] Database migrations committed to `docs/migrations/` and applied to the staging Supabase project
- [ ] Manual product QA completed for all affected user journeys
- [ ] Documentation updated if behavior changed

---

## Related Documents

- `docs/exercise-library.md` — source spec for Epic 1; data dependency for Epic 4 (Omni references exercise data for coaching responses)
- `docs/learning-system.md` — source spec for Epic 3 and partial Epic 2
- `docs/gamification.md` — source spec for Epic 2
- `docs/ai-coach.md` — source spec for Epic 4
- `docs/program-continuation.md` — source spec for Epic 5
- `docs/ROADMAP.md` — product versioning, branch model, and commit conventions
- `docs/V1_ENHANCEMENT_SPRINT_PLAN.md` — Sprint 0–5 planning context (pre-dates this plan)
- `docs/program-generation.md` — existing program generation pipeline called by Epic 5 continuation options
- `api/ask.ts` — existing RAG endpoint used by Omni Science Mode
- `api/adapt.ts` — existing adaptation endpoint extended by Omni Check-In Mode
- `api/generate-program.ts` — generation endpoint used for continuation blocks in Epic 5
