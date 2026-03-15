# Exercise Library

Complete reference for the Omnexus 300-exercise database — structure, classification system, equipment filtering, and the exercise discovery engine.

---

## Overview

The exercise library is the foundation of every program Omnexus generates, every equipment swap it suggests, and every technique lesson it delivers. The library grows from 61 exercises (v1.0) to 300 exercises (Sprint B target) and eventually to 500.

**Targets:**
- Sprint A: 150 total exercises (90 new)
- Sprint B: 300 total exercises (150 new) + redesigned ExerciseDetailPage
- Long-term: 500 exercises with anatomical SVG muscle maps and original video demonstrations

---

## Exercise Data Architecture

Every exercise entry carries the following fields:

### Identity Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Hyphenated lowercase identifier used throughout the system (e.g., `barbell-back-squat`) |
| `name` | `string` | Display name shown to users (e.g., `Barbell Back Squat`) |

### Classification Fields

| Field | Type | Values |
|---|---|---|
| `category` | `string` | `strength`, `cardio`, `mobility` |
| `movementPattern` | `string` | `squat`, `hinge`, `push-horizontal`, `push-vertical`, `pull-horizontal`, `pull-vertical`, `isolation`, `carry`, `cardio` |
| `primaryMuscles` | `MuscleGroup[]` | See expanded MuscleGroup type below |
| `secondaryMuscles` | `MuscleGroup[]` | See expanded MuscleGroup type below |

### Expanded MuscleGroup Type

```typescript
type MuscleGroup =
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'adductors' | 'abductors'
  | 'hip-flexors' | 'tibialis'
  | 'chest' | 'front-deltoid' | 'side-deltoid' | 'rear-deltoid' | 'rotator-cuff'
  | 'triceps' | 'biceps' | 'forearms'
  | 'lats' | 'traps' | 'rhomboids' | 'serratus' | 'erectors'
  | 'abs' | 'obliques'
```

### Equipment Fields

| Field | Type | Description |
|---|---|---|
| `equipment` | `Equipment[]` | Required equipment using expanded Equipment type |
| `exerciseVariants` | `ExerciseVariant[]` | Bodyweight, dumbbell, or band substitutions for automatic swaps |

### Expanded Equipment Type

```typescript
type Equipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'kettlebell' | 'ez-bar' | 'resistance-band' | 'suspension-trainer'
  | 'smith-machine' | 'trap-bar' | 'dip-bars' | 'rings'
  | 'bodyweight' | 'bench' | 'pull-up-bar' | 'box'
```

### Difficulty and Instructional Fields

| Field | Type | Description |
|---|---|---|
| `difficulty` | `1 \| 2 \| 3 \| 4 \| 5` | 1 = beginner, 5 = elite. Used by program generator to filter for training age. |
| `steps` | `string[]` | Step-by-step execution walkthrough |
| `commonMistakes` | `Mistake[]` | Each entry has `mistake` and `why` fields |
| `coachingCues` | `string[]` | Short verbal cues a trainer would say during the lift |
| `proTips` | `string[]` | Intermediate and advanced technique refinements |

### Progression Fields

| Field | Type | Description |
|---|---|---|
| `progressionPath.easier` | `string` | Exercise ID of an easier variation (used for injury regressions) |
| `progressionPath.harder` | `string` | Exercise ID of a harder variation (used as user advances) |

### Demonstration Fields

| Field | Type | Description |
|---|---|---|
| `youtubeId` | `string` | Entry in the `EXERCISE_YOUTUBE_IDS` map for the primary demo video |
| `demoSources` | `string[]` | Preferred coach channels for source video (see Demo Strategy below) |

### Search and Filter Metadata

| Field | Type | Description |
|---|---|---|
| `tags` | `string[]` | Muscle focus, equipment type, difficulty, movement pattern keywords |
| `popularityScore` | `number` | Derived from how often the exercise appears in generated programs (tracked via analytics) |

---

## Exercise Categories — 300-Exercise Target

### Barbell Movements — 45 exercises

**Squat pattern (10):**
`back-squat`, `front-squat`, `high-bar-squat`, `low-bar-squat`, `paused-squat`, `box-squat`, `safety-bar-squat`, `overhead-squat`, `zercher-squat`, `sumo-squat`

**Hinge pattern (10):**
`conventional-deadlift`, `sumo-deadlift`, `romanian-deadlift`, `stiff-leg-deadlift`, `good-morning`, `rack-pull`, `deficit-deadlift`, `snatch-grip-deadlift`, `barbell-hip-thrust`, `barbell-glute-bridge`

**Horizontal push (7):**
`barbell-bench-press`, `close-grip-bench-press`, `incline-barbell-press`, `decline-barbell-press`, `paused-bench-press`, `floor-press`, `barbell-push-press`

**Horizontal pull (5):**
`barbell-bent-over-row`, `barbell-pendlay-row`, `barbell-yates-row`, `barbell-seal-row`, `t-bar-row`

**Vertical push (3):**
`barbell-overhead-press`, `barbell-push-press`, `barbell-behind-neck-press`

**Vertical pull (2):**
`barbell-shrug`, `barbell-upright-row`

**Isolation (8):**
`barbell-curl`, `barbell-skull-crusher`, `barbell-reverse-curl`, `barbell-wrist-curl`, `barbell-lunge`, `barbell-reverse-lunge`, `barbell-step-up`, `barbell-calf-raise`

---

### Dumbbell Movements — 55 exercises

**Squat and lunge pattern (9):**
`dumbbell-goblet-squat`, `dumbbell-squat`, `dumbbell-sumo-squat`, `dumbbell-walking-lunge`, `dumbbell-reverse-lunge`, `dumbbell-lateral-lunge`, `dumbbell-step-up`, `dumbbell-bulgarian-split-squat`, `dumbbell-curtsy-lunge`

**Hinge pattern (4):**
`dumbbell-romanian-deadlift`, `dumbbell-single-leg-rdl`, `dumbbell-hip-thrust`, `dumbbell-good-morning`

**Horizontal push (8):**
`dumbbell-bench-press`, `dumbbell-incline-press`, `dumbbell-decline-press`, `dumbbell-floor-press`, `dumbbell-chest-fly`, `dumbbell-incline-fly`, `dumbbell-pullover`, `neutral-grip-dumbbell-press`

**Horizontal pull (5):**
`dumbbell-bent-over-row`, `dumbbell-single-arm-row`, `dumbbell-chest-supported-row`, `dumbbell-rear-delt-row`, `dumbbell-seal-row`

**Vertical push (6):**
`dumbbell-shoulder-press`, `arnold-press`, `dumbbell-lateral-raise`, `dumbbell-front-raise`, `dumbbell-upright-row`, `dumbbell-push-press`

**Vertical pull (2):**
`dumbbell-shrug`, `dumbbell-snatch`

**Isolation (12):**
`dumbbell-curl`, `hammer-curl`, `incline-dumbbell-curl`, `concentration-curl`, `zottman-curl`, `dumbbell-preacher-curl`, `dumbbell-tricep-extension`, `dumbbell-skull-crusher`, `dumbbell-kickback`, `dumbbell-calf-raise`, `dumbbell-wrist-curl`, `dumbbell-reverse-curl`

**Core (3):**
`dumbbell-side-bend`, `dumbbell-woodchop`, `dumbbell-russian-twist`

---

### Cable Machine Movements — 35 exercises

**Push (11):**
`cable-chest-fly`, `cable-incline-fly`, `cable-decline-fly`, `cable-crossover`, `cable-tricep-pushdown`, `cable-overhead-tricep-extension`, `cable-tricep-kickback`, `cable-shoulder-press`, `cable-upright-row`, `cable-front-raise`, `cable-lateral-raise`

**Pull (9):**
`cable-row`, `cable-lat-pulldown`, `cable-face-pull`, `straight-arm-pulldown`, `cable-pullover`, `cable-rear-delt-fly`, `cable-rope-row`, `cable-single-arm-lat-pulldown`, `cable-pull-through`

**Leg and hip (5):**
`cable-hip-abduction`, `cable-hip-adduction`, `cable-kickback-glute`, `cable-leg-curl`, `cable-ankle-raise`

**Core (6):**
`pallof-press`, `cable-woodchop`, `cable-crunch`, `cable-side-bend`, `cable-rotation`, `cable-reverse-crunch`

**Bicep (4):**
`cable-curl`, `cable-hammer-curl`, `cable-concentration-curl`, `cable-reverse-curl`

---

### Machine Movements — 30 exercises

**Leg machines (11):**
`leg-press`, `leg-extension`, `seated-leg-curl`, `lying-leg-curl`, `hack-squat`, `smith-machine-squat`, `smith-machine-rdl`, `seated-calf-raise`, `standing-calf-raise`, `hip-abduction-machine`, `hip-adduction-machine`

**Upper push machines (6):**
`chest-press-machine`, `incline-chest-press-machine`, `decline-chest-press-machine`, `pec-deck`, `shoulder-press-machine`, `assisted-dip-machine`

**Upper pull machines (5):**
`lat-pulldown-machine`, `seated-row-machine`, `assisted-pull-up-machine`, `rear-delt-pec-deck`, `t-bar-row-machine`

**Back machines (3):**
`back-extension-machine`, `hyperextension`, `glute-ham-raise`

**Other (4):**
`preacher-curl-machine`, `cable-curl-machine`, `tricep-pressdown-machine`, `ab-crunch-machine`

---

### Bodyweight Movements — 45 exercises

**Push (10):**
`push-up`, `wide-push-up`, `close-grip-push-up`, `decline-push-up`, `incline-push-up`, `pike-push-up`, `archer-push-up`, `pseudo-planche-push-up`, `diamond-push-up`, `explosive-push-up`

**Pull (8):**
`pull-up`, `chin-up`, `neutral-grip-pull-up`, `wide-grip-pull-up`, `inverted-row`, `bodyweight-row`, `australian-pull-up`, `L-sit-pull-up`

**Press (4):**
`dips`, `tricep-bench-dip`, `parallel-bar-dip`, `ring-dip`

**Squat and lunge (11):**
`bodyweight-squat`, `jump-squat`, `walking-lunge`, `reverse-lunge`, `lateral-lunge`, `bulgarian-split-squat`, `pistol-squat`, `box-jump`, `step-up`, `lateral-step-up`, `curtsy-lunge`

**Hinge (5):**
`glute-bridge`, `single-leg-glute-bridge`, `hip-thrust-bodyweight`, `nordic-hamstring-curl`, `good-morning-bodyweight`

**Core (12):**
`plank`, `side-plank`, `RKC-plank`, `hollow-body-hold`, `dead-bug`, `bird-dog`, `mountain-climbers`, `hanging-leg-raise`, `knee-tuck`, `ab-wheel-rollout`, `pallof-press-bodyweight`, `L-sit`

**Conditioning (5):**
`burpee`, `bear-crawl`, `inchworm`, `jumping-jack`, `high-knees`

---

### Kettlebell Movements — 25 exercises

**Swing pattern (4):**
`kettlebell-swing`, `kettlebell-single-arm-swing`, `kettlebell-alternating-swing`, `kettlebell-sumo-deadlift-high-pull`

**Squat and lunge (5):**
`kettlebell-goblet-squat`, `kettlebell-front-rack-squat`, `kettlebell-lunge`, `kettlebell-step-up`, `kettlebell-suitcase-squat`

**Hinge (4):**
`kettlebell-romanian-deadlift`, `kettlebell-single-leg-rdl`, `kettlebell-hip-thrust`, `kettlebell-good-morning`

**Press (4):**
`kettlebell-press`, `kettlebell-push-press`, `kettlebell-floor-press`, `kettlebell-windmill`

**Pull (3):**
`kettlebell-row`, `kettlebell-single-arm-row`, `kettlebell-high-pull`

**Olympic and complex (5):**
`kettlebell-clean`, `kettlebell-snatch`, `turkish-get-up`, `kettlebell-clean-and-press`, `kettlebell-halo`

---

### EZ Bar Movements — 10 exercises

`ez-bar-curl`, `ez-bar-preacher-curl`, `ez-bar-reverse-curl`, `ez-bar-skull-crusher`, `ez-bar-overhead-extension`, `ez-bar-upright-row`, `ez-bar-bent-over-row`, `ez-bar-close-grip-press`, `ez-bar-front-squat`, `ez-bar-drag-curl`

---

### Resistance Band Movements — 20 exercises

`band-pull-apart`, `band-face-pull`, `band-bicep-curl`, `band-tricep-pushdown`, `band-overhead-press`, `band-lateral-raise`, `band-front-raise`, `band-row`, `band-lat-pulldown`, `band-pull-through`, `band-hip-thrust`, `band-squat`, `band-monster-walk`, `band-clamshell`, `band-lateral-walk`, `band-glute-bridge`, `band-chest-press`, `band-chest-fly`, `band-pallof-press`, `band-woodchop`

---

### TRX and Suspension Trainer — 15 exercises

`trx-row`, `trx-fallout`, `trx-chest-press`, `trx-pushup`, `trx-bicep-curl`, `trx-tricep-extension`, `trx-squat`, `trx-lunge`, `trx-single-leg-squat`, `trx-hip-thrust`, `trx-plank`, `trx-pike`, `trx-mountain-climber`, `trx-hamstring-curl`, `trx-Y-fly`

---

### Mobility and Flexibility — 20 exercises

`hip-flexor-stretch`, `pigeon-pose`, `thoracic-rotation`, `world-greatest-stretch`, `cat-cow`, `child-pose-extended`, `lizard-pose`, `deep-squat-hold`, `ankle-circles`, `shoulder-circles`, `lat-stretch-doorway`, `pec-stretch`, `hamstring-stretch-standing`, `quad-stretch`, `calf-stretch-wall`, `couch-stretch`, `band-dislocates`, `foam-roll-quads`, `foam-roll-thoracic`, `foam-roll-lats`

---

## Exercise Library Summary by Count

| Equipment Category | Target Count |
|---|---|
| Barbell | 45 |
| Dumbbell | 55 |
| Cable Machine | 35 |
| Machine | 30 |
| Bodyweight | 45 |
| Kettlebell | 25 |
| EZ Bar | 10 |
| Resistance Band | 20 |
| TRX / Suspension | 15 |
| Mobility / Flexibility | 20 |
| **Total** | **300** |

---

## Equipment Filtering in Program Generation

The program generator uses the `equipment` field of each exercise to determine which exercises are available for a given user's setup. The `exerciseVariants` field enables automatic swaps:

1. User completes onboarding and selects available equipment.
2. Program generator filters candidate exercises to those matching the user's equipment set.
3. If no match is found for a required movement pattern, the generator traverses `exerciseVariants` to find the best available substitute.
4. The `difficulty` field prevents the generator from assigning technically demanding movements (difficulty 4–5) to users with `trainingAgeYears` of 0.

**Equipment Swap Feature (user-facing):** On any exercise detail page, tapping "Can't do this exercise" shows three alternative exercises from `exerciseVariants` that train the same primary muscles with different equipment requirements.

---

## Exercise Detail Page Design

The redesigned `ExerciseDetailPage` (Sprint B) shows:

1. **Full-width demo video section** at the top with lazy loading (YouTube embed from `EXERCISE_YOUTUBE_IDS`).
2. **Tabbed interface** below with four tabs:
   - **How To** — the `steps` array rendered as a numbered walkthrough
   - **Common Mistakes** — the `commonMistakes` array with mistake + why
   - **Variations** — `exerciseVariants` with difficulty badges and quick-add to workout
   - **Coach Cues** — the `coachingCues` array rendered as a vertical list of callout cards
3. **Equipment Substitute Finder** — three alternatives shown when user taps "Can't do this."
4. **Difficulty Badge** — visual indicator showing exercise level (1–5).
5. **Muscle Activation Summary** — text-based visual showing primary and secondary muscles. Long-term upgrade: anatomical SVG map.
6. **Personal Best** — user's best recorded set on this exercise pulled from workout history.
7. **Related Exercises** — similar movements in the same movement pattern category.
8. **Movement Pattern Library Button** — links to the full pattern browser.

---

## Exercise Discovery Engine

Instead of a flat list, the exercise browser is an intelligent discovery system with five browse modes:

### Browse by Movement Pattern
Every movement pattern shows all exercises that belong to it. Useful for programming variety — e.g., "show me every horizontal push."

### Browse by Muscle
A visual muscle map where tapping a muscle reveals all exercises that train it. Implements the expanded `MuscleGroup` type for high-resolution targeting.

### Browse by Equipment
Shows exactly what can be done with the user's available equipment. Automatically respects the user's saved equipment profile from onboarding.

### Browse by Difficulty
Filters exercises to beginner-friendly movements (1–2) or elite challenges (4–5). Ideal for users who want to find their next progression target.

### Natural Language Search
A semantic search mode powered by the existing RAG infrastructure. Users type queries like "best exercises for upper back with no barbell" and receive semantically relevant results rather than keyword-matched ones.

---

## Exercise Demo Strategy

Every exercise will have a primary YouTube demo link. The `EXERCISE_YOUTUBE_IDS` map will be expanded to cover all 300 exercises.

**Preferred source channels:**

| Coach | Specialty |
|---|---|
| Jeff Nippard | Science-based explanations, hypertrophy mechanics |
| Alan Thrall | Raw powerlifting technique |
| Jeremy Ethier | Hypertrophy mechanics, beginner-friendly |
| Dr. Mike Israetel | Volume and intensity guidance (MEV, MV, MAV, MRV) |
| Squat University | Corrective technique and mobility content |

**Long-term target:** Commission original video demonstrations featuring professional athletes filmed from multiple camera angles for the highest-priority exercises in the library.

---

## Content File Structure

All exercise data lives in `src/data/exercises/`. Each equipment category is a separate file:

```
src/data/exercises/
├── barbell.ts
├── dumbbell.ts
├── cable.ts
├── machine.ts
├── bodyweight.ts
├── kettlebell.ts
├── ez-bar.ts
├── resistance-band.ts
├── trx.ts
├── mobility.ts
└── index.ts       (exports merged EXERCISE_LIBRARY constant)
```

This structure makes content easy to add, edit, and eventually migrate to a CMS without changing application code.

---

## Sprint Plan

| Sprint | Deliverable |
|---|---|
| **Sprint A** | 90 new exercises across barbell, dumbbell, cable, machine, bodyweight, kettlebell. Expand `MuscleGroup` and `Equipment` types. Total: 150 exercises. |
| **Sprint B** | 150 additional exercises covering EZ bar, resistance band, TRX, Smith machine, mobility, remaining bodyweight. Redesign `ExerciseDetailPage`. Implement Equipment Swap. Total: 300 exercises. |
| **Sprint I** | Build muscle map browser, movement pattern browser, equipment filter, natural language search, and Equipment Swap recommendation feature. |

---

## Related Documents

- `../archive/Program_Mastery.md` — Part One: Exercise Library
- `program-continuation.md` — how exercises feed into block-over-block progression tracking
- `ai-coach.md` — how Omni references the exercise library for coaching responses
