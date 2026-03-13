# Learning System

Full course architecture, gamification mechanics, XP calculation rules, spaced repetition algorithm, and database schema for the Omnexus learning system.

---

## Vision

The Omnexus learning system applies Duolingo's core engagement mechanics — daily streaks, XP rewards, combo multipliers, leaderboards, and achievement unlocks — to fitness education. The goal is to make users open the app not just to log a workout, but to earn XP, maintain their streak, complete a course, and beat their friends on the learning leaderboard.

See `docs/gamification.md` for the full XP system, rank thresholds, streak mechanics, achievement catalogue, and Sparks currency details.

---

## Course Architecture

The learning system has **five categories** of courses. Each category contains multiple courses. Each course contains multiple modules of 3–6 lessons. Every lesson takes 3–7 minutes to complete. Every module ends with a quiz. Every course ends with a comprehensive assessment.

### Category 1 — Foundations of Training

Entry point for all new users. Welcoming, not overwhelming.

**Course: How Your Body Gets Stronger**
- Modules: What Is Progressive Overload · How Muscles Actually Grow · The Role of Recovery · Sleep and Gains · Why Rest Days Are Training Days
- Lessons per module: 3–4 short lessons
- Assessment: 15-question quiz covering all modules

**Course: Understanding Your Training Program**
- Modules: What Is a Training Split · Understanding Sets and Reps · What Is RPE and Why It Matters · Reading Your Program Card · How to Know When to Increase Weight

**Course: Beginner Movement Mastery**
- Modules: The Hip Hinge (the most important movement pattern) · The Squat Pattern · Pushing Patterns · Pulling Patterns · Core Stability vs Core Strength
- Format: Each module is exercise-focused with video integration and guided self-assessment

---

### Category 2 — Nutrition Science

**Course: Nutrition Fundamentals for Athletes**
- Modules: Calories Explained (not a diet, a measurement) · The Three Macronutrients · Protein the Priority Nutrient · Carbohydrates as Fuel · Fat as Structure · Hydration and Performance

**Course: Eating for Your Goal**
- Modules: Calorie Surplus for Muscle Building (how much is too much) · Calorie Deficit for Fat Loss (preserving muscle) · Maintenance Eating for Performance · Nutrient Timing Around Workouts · Pre-Workout Fueling · Post-Workout Recovery Nutrition

**Course: Practical Nutrition Habits**
- Modules: Meal Prep for Busy Athletes · Reading a Nutrition Label · High Protein Foods You Actually Like · Managing Nutrition When Traveling · Social Eating and Staying on Track

**Course: Supplements — Evidence and Reality**
- Modules: What Creatine Actually Does (with evidence) · Protein Powder as Food Not Magic · Caffeine as a Performance Tool · What the Science Says About Popular Supplements · What You Do Not Need to Buy

---

### Category 3 — Exercise Science

**Course: Understanding Hypertrophy**
- Modules: Mechanical Tension vs Metabolic Stress · Muscle Fiber Types and Recruitment · Volume Landmarks (MEV MV MAV MRV explained simply) · Frequency Myths and Facts · The Rep Range Spectrum

**Course: Strength Development**
- Modules: Neural Adaptations vs Structural Adaptations · The Strength-Hypertrophy Continuum · Peaking and Tapering · Training for Maximal Strength vs Functional Strength · Powerlifting vs Olympic Lifting vs Bodybuilding

**Course: Fat Loss Science**
- Modules: Why the Scale Lies · Body Recomposition and Who It Works For · NEAT and Why It Matters More Than Cardio · Cardio as a Tool Not a Punishment · Preserving Muscle During a Deficit

**Course: Recovery and Adaptation**
- Modules: Supercompensation Explained · Active vs Passive Recovery · What Soreness Actually Means · The Deload Week and Why Smart Athletes Love It · Sleep Optimization for Athletes

**Course: Program Design Principles**
- Modules: The Minimum Effective Dose · Block Periodization · Linear vs Undulating Progression · Managing Training Age · When to Hire a Coach

---

### Category 4 — Movement and Technique

**Course: Squat Mastery**
- Modules: The Perfect Squat Anatomy · Bar Path and Stance Width · Depth and How to Achieve It · Common Errors and Corrections · Programming the Squat Across Experience Levels

**Course: Deadlift Mastery**
- Modules: Conventional vs Sumo Debate · The Setup Ritual That Changes Everything · Bracing and Intra-Abdominal Pressure · Hip Hinge vs Leg Drive · Grip Variations and When to Use Straps

**Course: Bench Press Mastery**
- Modules: The Arch Debate (natural vs extreme) · Shoulder Safety and Positioning · Leg Drive and Full Body Tension · Grip Width and Bar Path · Spotter Communication and Safety

**Course: Overhead Press Mastery**
- Modules: Shoulder Anatomy and Pressing · Bar Path for Overhead vs Push Press · Core Bracing for Overhead Work · Common Shoulder Injuries and Prevention · Programming Overhead Volume Safely

**Course: Pull-Up and Row Mastery**
- Modules: Scapular Control Before Arm Strength · Full Range of Motion and Why It Matters · Lat Dominance vs Bicep Dominance · Programming Pulling Volume · Building from Zero to Your First Pull-Up

---

### Category 5 — Mind and Performance

**Course: Training Psychology**
- Modules: The Identity of an Athlete · Motivation vs Discipline and When Each Matters · Managing Training Anxiety · Building Gym Confidence as a Beginner · Visualization and Mental Rehearsal

**Course: Injury Prevention and Longevity**
- Modules: How Injuries Actually Happen · Listening to Your Body vs Pushing Through · Common Gym Injuries and How to Avoid Them · Training Around Pain vs Training Through Pain · Building a Decades-Long Training Career

**Course: Goal Setting for Athletes**
- Modules: Outcome Goals vs Process Goals · The Hierarchy of Athletic Metrics · Short-Term and Long-Term Programming · Tracking Progress Beyond the Scale · Celebrating Non-Scale Victories

---

## Lesson Format Design

Each lesson is a micro-interactive experience with five sections:

### 1. Hook
A single bold statement or question that creates curiosity.
> *Most people think soreness means growth. They are completely wrong.*

### 2. Knowledge Block
Two to four paragraphs of clear, jargon-free explanation. Written at a high school reading level. Uses real-world analogies.
> *Think of your muscle like a construction site. Soreness is just the cleanup crew. Growth happens after the cleanup is done.*

### 3. Interactive Checkpoint
Midway through the lesson, a single-question knowledge check appears (not a formal quiz). Two or three answer options. Getting it right awards mini XP and continues. Getting it wrong shows a one-sentence explanation and continues. Never blocks progress.

### 4. Key Takeaways
A bullet-point summary of the three most important concepts from the lesson. These become the content for the spaced repetition system.

### 5. Real World Application
A single actionable instruction tied directly to what was just learned.
> *This week when you feel sore, skip the temptation to rest extra. Do a light movement session instead and notice how you feel.*

### 6. Share Card (Optional)
An optional share card with the lesson topic and a key quote the user can share to Instagram or friends. Passive growth mechanic.

---

## Quiz Design

**Module quizzes:** 8–12 questions.
**Course assessments:** 20 questions.

### Question Types

| Type | Description |
|---|---|
| Multiple choice | Four options; one or two are traps testing true understanding vs. surface memorization |
| True or false | After answering, a one-sentence reason appears regardless of correctness |
| Fill in the blank | One missing word selected from three options |
| Order the steps | Drag or tap to put steps in the correct sequence |
| Image question *(future phase)* | Identify a movement pattern from an image or diagram |

### Failed Quiz Recovery

Users who score below 70% see the lessons they struggled with highlighted. They are offered a **Quick Retry** with three questions focused on their weak points before attempting the full quiz again. Prevents frustration while enforcing mastery.

---

## XP Earned Through Learning

| Action | XP Awarded |
|---|---|
| Lesson completed | 10 XP |
| Perfect quiz score | 20 XP |
| Module completed | 50 XP |
| Course completed | 200 XP |
| Interactive checkpoint correct | Mini XP reward |

See `docs/gamification.md` for the full XP table including workout actions, combo multipliers, and rank thresholds.

---

## Spaced Repetition System

Implemented in `src/services/spacedRepetition.ts`.

Key concepts from completed lessons surface again through a **daily Review session** taking 3–5 minutes. The session resurfaces 5–10 flashcard-style questions from previously completed content.

### Algorithm

The algorithm is adapted from the SM-2 / Anki model used by Duolingo's Word Review feature:

1. Each concept from a completed lesson is assigned an initial review interval (1 day).
2. After each review, the user's confidence level (correct / incorrect) updates the interval:
   - **Correct:** interval multiplies by the ease factor (default 2.5)
   - **Incorrect:** interval resets to 1 day
3. Concepts answered perfectly multiple times are shown less frequently.
4. Concepts answered incorrectly are shown more frequently.

### Implementation Notes

- Lesson IDs from `src/data/courses/` are used as the flashcard reference.
- Key Takeaways from each lesson become the flashcard content.
- Review session state is persisted in Supabase (`learning_review_queue` — see Database Schema below).

---

## Learning Paths

Users are routed to a recommended learning path based on training goal and experience level from onboarding. Paths can be switched at any time from the Learn page. Progress across all courses is retained regardless of active path.

| Path | Trigger | Course Sequence |
|---|---|---|
| **Path A — Beginner Foundation** | `trainingAgeYears === 0` | Foundations of Training → Nutrition Fundamentals → Beginner Movement Mastery |
| **Path B — Hypertrophy Specialist** | `goal === 'hypertrophy'` | Understanding Hypertrophy → Nutrition for Muscle Building → relevant technique mastery courses |
| **Path C — Fat Loss** | `goal === 'fat-loss'` | Fat Loss Science → Practical Nutrition Habits → Recovery and Adaptation |
| **Path D — Strength** | `trainingAge` intermediate/advanced + strength goal | Strength Development → movement mastery courses → Program Design Principles |
| **Path E — Longevity** | `goal === 'general-fitness'` or older athletes | Injury Prevention and Longevity → Foundations of Training → Training Psychology |

---

## Social Learning Features

### Study Groups
- Users create or join a group of up to 10 people.
- Groups have a shared weekly XP total and a weekly group challenge (e.g., "complete 5 lessons collectively this week").
- Completing the group challenge gives every member a bonus XP reward.

### Knowledge Battles
- Two friends challenge each other to a timed 10-question quiz on a topic of their choice.
- Winner earns XP from the loser. Loser earns a smaller consolation XP prize.
- Can only be initiated between friends.
- State tracked in `learning_battles` table.

### Teach It Back
- After completing a course, the user unlocks the ability to write a brief explanation of the concept in their own words.
- Other users can rate the explanation as helpful.
- High-rated contributions earn Sparks and are featured in the community section.

---

## Daily Lesson Challenge

Each day the app selects one specific lesson that awards **triple XP** if completed that day. The challenge rotates every 24 hours. This creates a daily check-in habit beyond workout logging.

---

## Content File Structure

Learning content is stored as structured JSON in `src/data/courses/`. Each course is a separate file:

```
src/data/courses/
├── foundations-how-body-gets-stronger.json
├── foundations-understanding-your-program.json
├── foundations-beginner-movement-mastery.json
├── nutrition-fundamentals.json
├── nutrition-eating-for-goal.json
├── nutrition-practical-habits.json
├── nutrition-supplements.json
├── science-hypertrophy.json
├── science-strength-development.json
├── science-fat-loss.json
├── science-recovery-adaptation.json
├── science-program-design.json
├── technique-squat-mastery.json
├── technique-deadlift-mastery.json
├── technique-bench-press-mastery.json
├── technique-overhead-press-mastery.json
├── technique-pullup-row-mastery.json
├── mind-training-psychology.json
├── mind-injury-prevention.json
└── mind-goal-setting.json
```

### Course JSON Schema

```json
{
  "id": "foundations-how-body-gets-stronger",
  "title": "How Your Body Gets Stronger",
  "category": "foundations",
  "description": "...",
  "modules": [
    {
      "id": "module-progressive-overload",
      "title": "What Is Progressive Overload",
      "lessons": [
        {
          "id": "lesson-po-intro",
          "title": "...",
          "hook": "...",
          "knowledgeBlocks": ["..."],
          "checkpoint": { "question": "...", "options": [...], "correctIndex": 0, "explanation": "..." },
          "keyTakeaways": ["...", "...", "..."],
          "realWorldApplication": "...",
          "shareCardQuote": "..."
        }
      ],
      "quiz": {
        "questions": [...]
      }
    }
  ],
  "assessment": {
    "questions": [...]
  }
}
```

---

## Database Schema

```sql
-- Tracks the user's total XP, rank, and weekly XP
CREATE TABLE user_xp (
  user_id       UUID PRIMARY KEY REFERENCES auth.users,
  total_xp      INTEGER NOT NULL DEFAULT 0,
  current_rank  INTEGER NOT NULL DEFAULT 1,
  weekly_xp     INTEGER NOT NULL DEFAULT 0,
  weekly_xp_resets_at TIMESTAMPTZ NOT NULL
);

-- Tracks learning streaks
CREATE TABLE learning_streaks (
  user_id          UUID PRIMARY KEY REFERENCES auth.users,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_lesson_date DATE,
  freeze_tokens    INTEGER NOT NULL DEFAULT 0
);

-- Achievement catalogue (static reference table)
CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  tier        TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  xp_reward   INTEGER NOT NULL,
  icon_name   TEXT NOT NULL
);

-- User-earned achievements
CREATE TABLE user_achievements (
  user_id        UUID REFERENCES auth.users,
  achievement_id TEXT REFERENCES achievements,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- In-app Sparks currency
CREATE TABLE user_sparks (
  user_id          UUID PRIMARY KEY REFERENCES auth.users,
  total_sparks     INTEGER NOT NULL DEFAULT 0,
  earned_lifetime  INTEGER NOT NULL DEFAULT 0,
  spent_lifetime   INTEGER NOT NULL DEFAULT 0
);

-- Append-only XP event log
CREATE TABLE xp_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users,
  event_type  TEXT NOT NULL,
  xp_amount   INTEGER NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge Battle tracking
CREATE TABLE learning_battles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES auth.users,
  receiver_id UUID REFERENCES auth.users,
  topic       TEXT NOT NULL,
  sender_score    INTEGER,
  receiver_score  INTEGER,
  outcome     TEXT CHECK (outcome IN ('sender_won', 'receiver_won', 'draw', 'pending')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Spaced repetition review queue
CREATE TABLE learning_review_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users,
  lesson_id    TEXT NOT NULL,
  concept_id   TEXT NOT NULL,
  next_review  DATE NOT NULL,
  ease_factor  NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  review_count INTEGER NOT NULL DEFAULT 0
);
```

---

## AppContext State Extensions

The `AppContext` reducer will be extended to handle:

- XP updates (immediate client-side optimistic update + server sync)
- Streak updates (on lesson completion, before midnight check)
- Achievement unlocks (triggers celebration animation on unlock)
- Sparks balance changes (on earn and spend events)

This avoids round-trip latency for the celebration mechanics — the UI fires immediately, and the server sync follows asynchronously.

---

## Sprint Plan

| Sprint | Deliverable |
|---|---|
| **Sprint C** | Six new Supabase tables. XP event system in AppContext. Rank badges. Streak tracker. XP rewards on existing actions. Achievement catalogue. |
| **Sprint D** | Foundations + Nutrition Fundamentals courses in JSON. Lesson reader component (hook, knowledge block, checkpoint, takeaways, application). Quiz engine (multiple choice, T/F, fill in the blank). Combo multiplier. Daily Lesson Challenge. |
| **Sprint E** | Exercise Science, Movement Mastery, Mind and Performance courses. Learning Path routing. Spaced Repetition review session. Course completion certificate screen. |
| **Sprint F** | Study Groups, Knowledge Battles, Teach It Back. Weekly XP leaderboard integration with learning. |

---

## Related Documents

- `docs/gamification.md` — XP rules, rank thresholds, streak mechanics, achievements, Sparks
- `docs/ai-coach.md` — Omni's Science Mode references course content and RAG system
- `docs/Program_Mastery.md` — Parts Two and Three (original vision)
