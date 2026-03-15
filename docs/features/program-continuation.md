# Program Continuation

How Omnexus handles end-of-block transitions: Progression Report generation, the three continuation options, and program chaining in the database.

---

## Overview

When a user finishes their 8-week training block, the app does not simply end. The system generates a **Progression Report** — a structured summary of what the user achieved — and then offers three forward paths. This turns a potential drop-off moment into a re-engagement moment and makes Omnexus feel like it has a multi-year training plan rather than a series of disconnected 8-week blocks.

---

## Trigger Conditions

The program continuation flow triggers when:

1. The user completes the final workout of Week 8 (or the final programmed day of the block).
2. The `workoutCompleted` event fires and the current program state shows `week === 8` and `allDaysCompleted === true`.

The continuation screen replaces the normal post-workout completion screen for the block's final session.

---

## Progression Report

The Progression Report is auto-generated from workout history data for the completed block. It is displayed as a styled summary screen before presenting the three continuation options.

### Report Sections

#### 1. Block Overview
- Program name and split
- Start date → end date
- Total weeks completed (8 of 8, or however many were actually completed)
- Total workouts logged during the block

#### 2. Volume Summary
- Per-muscle-group volume totals across the 8 weeks (sets × reps × weight)
- Displayed as a horizontal bar chart sorted by volume
- Muscle groups are drawn from the expanded `MuscleGroup` type

#### 3. Personal Records Set
- List of every PR recorded during the block
- Exercise name, PR weight, and the session date it was achieved
- Highlighted with a trophy icon

#### 4. Consistency Score
- Percentage of planned workouts completed (e.g., "36 of 40 planned sessions — 90%")
- Visual progress ring showing the percentage
- Benchmark text: "Top 15% of Omnexus athletes in your goal category"

#### 5. Key Milestones
- Rank-ups earned during the block
- Achievements unlocked
- Learning streaks maintained

#### 6. AI-Generated Narrative (Omni)
A 2–4 sentence personalized summary written by Omni. Generated via a single API call when the block ends.

**Example:**
> You came into this block at 100kg on the squat and finished at 112.5kg with consistent 4× weekly frequency. Your pulling volume was your strongest week-over-week trend — your rows jumped 15kg across the 8 weeks. The deload in week 4 clearly worked: week 5 was your best performance week of the block. You're ready to intensify.

**Prompt structure for narrative generation:**

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

---

## Three Continuation Options

After the Progression Report, the user is presented with three clearly labeled options:

### Option 1 — Build on This Block

**Label:** "Continue and intensify"

**Description shown to user:** "Generate a new 8-week block using the same exercises, higher intensities, and different volume structures. Best if you want to keep building on what's working."

**What the system does:**
1. Reads the completed program's exercise selection, split, and current 1RM estimates.
2. Adjusts the intensity progression: increases working percentages by 5–10%, reduces volume slightly (periodization shift from accumulation to intensification).
3. Calls `/api/generate-program` with the continuation parameters and a flag indicating this is an intensification block.
4. Generates a new 8-week program and saves it as the user's next active program.
5. The two programs are linked in the database via `predecessor_program_id`.

### Option 2 — Change Focus

**Label:** "Change training goal"

**Description shown to user:** "Update your training goal and start a completely new 8-week program. Best if you want to shift from hypertrophy to strength, or try a new split."

**What the system does:**
1. Opens the goal selection screen (same as onboarding, but pre-filled with current settings).
2. User updates: goal, split preference, available equipment, days per week.
3. Calls `/api/generate-program` with the new parameters. No continuity with the previous block.
4. Generates and saves the new program. The new program does not reference the previous block.

### Option 3 — Deload Week First

**Label:** "Take a deload week first"

**Description shown to user:** "Generate one week of active recovery before your next block. Best if you're feeling beaten up or want to recharge before pushing again."

**What the system does:**
1. Generates a **single-week deload program** using the same primary exercises at 50–60% of the user's normal working weight, reduced volume (2–3 sets per exercise), and no AMRAP sets.
2. After the deload week is completed, the continuation screen appears again with Options 1 and 2 available.
3. The deload week is tagged as `blockType: 'deload'` in the database and does not count as an independent program block for analytics purposes.

---

## Database Schema

### programs Table Extension

```sql
ALTER TABLE programs ADD COLUMN IF NOT EXISTS predecessor_program_id UUID REFERENCES programs(id);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS block_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (block_type IN ('standard', 'intensification', 'deload', 'custom'));
ALTER TABLE programs ADD COLUMN IF NOT EXISTS continuation_option TEXT
  CHECK (continuation_option IN ('build-on', 'change-focus', 'deload', NULL));
```

### progression_reports Table

```sql
CREATE TABLE progression_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users,
  program_id           UUID REFERENCES programs(id),
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consistency_percent  NUMERIC(5,2),
  total_workouts       INTEGER,
  planned_workouts     INTEGER,
  top_prs              JSONB,         -- array of { exerciseId, weight, date }
  volume_by_muscle     JSONB,         -- { muscleGroup: totalVolume }
  omni_narrative       TEXT,
  viewed_at            TIMESTAMPTZ    -- null until user views the report
);
```

### program_chains View (for analytics)

```sql
CREATE VIEW program_chains AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.block_type,
  p.continuation_option,
  p.predecessor_program_id,
  p.created_at,
  p.completed_at,
  predecessor.name AS predecessor_name,
  predecessor.completed_at AS predecessor_completed_at
FROM programs p
LEFT JOIN programs predecessor ON p.predecessor_program_id = predecessor.id;
```

---

## Continuation Intelligence — Technical Flow

```
User completes final workout
        │
        ▼
workoutCompleted event fires
        │
        ▼
Check: is this the last workout of an 8-week block?
        │
   YES  │   NO ──► Normal post-workout screen
        ▼
Generate Progression Report
  - Query workout history for program_id
  - Calculate consistency, volume, PRs
  - Call Claude for Omni narrative (single API call)
  - Write to progression_reports table
        │
        ▼
Show Progression Report screen
        │
        ▼
User selects continuation option
        │
   ┌────┴────┐
   │  Option  │
   │    1     │────► Generate intensification block
   │  Option  │────► Show goal selection → generate new block  
   │    2     │
   │  Option  │────► Generate deload week → deload completion → show Options 1+2
   │    3     │
   └──────────┘
```

---

## Program Chaining in the UI

The **Body Transformation Timeline** (see `../archive/Program_Mastery.md` Part Three) shows linked program blocks as continuous segments on the timeline. Each segment is colored by `block_type`:

| Block Type | Timeline Color |
|---|---|
| `standard` | Blue |
| `intensification` | Orange |
| `deload` | Green |
| `custom` | Purple |

Tapping a segment opens the Progression Report for that block.

---

## Progression Report Display Design

The Progression Report is a full-screen, scrollable experience:

1. **Header:** Program name, date range, completion badge (e.g., "Block Complete ✓")
2. **Consistency Ring:** Large circular progress indicator with percentage
3. **Omni Narrative:** Displayed as a quote card with Omni's avatar icon
4. **Volume Bar Chart:** Horizontal bars per muscle group, sorted by volume
5. **PR List:** Exercise name, PR weight, session date — trophies for top 3
6. **Milestones:** Rank-ups, achievements, streak milestones earned during the block
7. **Share Button:** Generates a shareable image of the report summary
8. **Continue Button:** Scrolls to the three continuation options

---

## Sprint Plan

| Sprint | Deliverable |
|---|---|
| **Sprint H** | Build Progression Report generation (data query + Omni narrative API call). Build Progression Report screen with consistency ring, volume chart, PR list, milestones. Build the three continuation option UI. Wire Option 1 (intensification block generation) and Option 3 (deload week generation). Wire Option 2 (goal change → new program generation). Add `predecessor_program_id` and `block_type` columns to `programs`. Create `progression_reports` table. Build program chain link in Body Transformation Timeline. |

---

## Related Documents

- `ai-coach.md` — Omni generates the narrative summary
- `program-generation.md` — existing program generation pipeline called by Options 1 and 2
- `gamification.md` — XP awarded on program completion (200 XP for course, equivalent logic for block completion)
- `../archive/Program_Mastery.md` — Part Three: Program Continuation Intelligence (original vision)
- `api/generate-program.ts` — generation endpoint used for continuation blocks
- `api/adapt.ts` — adaptation context referenced when generating intensification blocks
