/**
 * Conditioning Engine
 *
 * Generates evidence-based conditioning sessions that integrate cleanly into
 * resistance-training programs.  All logic is pure and deterministic — no AI
 * calls are needed.
 *
 * Design principles:
 *  - Session type (HIIT, LISS, circuit, intervals, EMOM) is chosen based on
 *    goal, training age, and equipment availability.
 *  - Equipment availability is strictly respected.
 *  - Duration targets match the user's stated session window.
 *  - Generated TrainingDay objects use the same schema as the rest of the app
 *    so they drop straight into a Program.schedule.
 */

import type {
  TrainingDay,
  ProgramExercise,
  ConditioningProfile,
  UserTrainingProfile,
} from '../types';

// ─── Equipment detection helpers ──────────────────────────────────────────────

/** Canonical equipment IDs that count as a "kettlebell" */
const KETTLEBELL_IDS = new Set(['kettlebell']);

/** Canonical equipment IDs that count as a cardio machine */
const CARDIO_MACHINE_IDS = new Set([
  'cardio-machine',
  'cardio',
  'bike',
  'treadmill',
  'rower',
]);

function hasKettlebell(equipment: string[]): boolean {
  return equipment.some((e) => KETTLEBELL_IDS.has(e.toLowerCase()));
}

function hasCardioMachine(equipment: string[]): boolean {
  return equipment.some((e) => CARDIO_MACHINE_IDS.has(e.toLowerCase()));
}

// ─── Exercise pools by equipment availability ─────────────────────────────────

const BODYWEIGHT_CONDITIONING: ProgramExercise[] = [
  { exerciseId: 'mountain-climbers', scheme: { sets: 4, reps: '30s', restSeconds: 30 }, notes: 'W1-W2: 20s work | W3: 25s | W4: Deload 15s | W5-W6: 30s | W7: 35s | W8: 40s' },
  { exerciseId: 'box-jump', scheme: { sets: 4, reps: '8', restSeconds: 60 }, notes: 'W1-W2: 6 reps | W3: 8 reps | W4: Deload 4 reps | W5-W6: 8 reps | W7: 10 reps | W8: Max sets' },
  { exerciseId: 'plank', scheme: { sets: 3, reps: '45s', restSeconds: 30 }, notes: 'W1: 30s | W2-W3: 45s | W4: Deload 20s | W5-W6: 45s | W7: 60s | W8: 60s+' },
];

const KETTLEBELL_CONDITIONING: ProgramExercise[] = [
  { exerciseId: 'kettlebell-swing', scheme: { sets: 5, reps: '20', restSeconds: 60 }, notes: 'W1-W2: 15 reps @RPE6 | W3: 20 reps @RPE7 | W4: Deload 12 reps | W5-W6: 20 reps @RPE7 | W7: 25 reps @RPE8 | W8: 30 reps or test' },
];

const CARDIO_MACHINE_CONDITIONING: ProgramExercise[] = [
  { exerciseId: 'mountain-climbers', scheme: { sets: 1, reps: '20-30 min', restSeconds: 0 }, notes: 'W1-W2: 20 min steady-state | W3: 25 min | W4: Deload 15 min easy | W5-W6: 25 min moderate | W7: 30 min | W8: 30 min or interval session' },
];

// ─── Session builders ─────────────────────────────────────────────────────────

/**
 * Build a HIIT (High-Intensity Interval Training) day.
 * Best for fat-loss goals and time-constrained athletes.
 */
function buildHiitDay(profile: UserTrainingProfile, label: string): TrainingDay {
  const kb = hasKettlebell(profile.equipment);
  const cardio = hasCardioMachine(profile.equipment);

  const exercises: ProgramExercise[] = [
    ...BODYWEIGHT_CONDITIONING,
    ...(kb ? KETTLEBELL_CONDITIONING : []),
  ];

  // Trim to fit within session duration (roughly 3 min per exercise)
  const maxExercises = Math.max(2, Math.floor(profile.sessionDurationMinutes / 8));
  const selected = exercises.slice(0, maxExercises);

  // Always include steady-state cooldown if cardio machine available and time permits
  if (cardio && profile.sessionDurationMinutes >= 30 && selected.length < maxExercises) {
    selected.push({
      exerciseId: 'mountain-climbers',
      scheme: { sets: 1, reps: '10 min', restSeconds: 0 },
      notes: 'W1-W4: 10 min easy cool-down | W5-W8: 10 min moderate cool-down',
    });
  }

  return { label, type: 'cardio', exercises: selected };
}

/**
 * Build an LISS (Low-Intensity Steady State) cardio day.
 * Best for recovery, fat-loss at low training age, or active rest.
 */
function buildLissDay(profile: UserTrainingProfile, label: string): TrainingDay {
  const cardio = hasCardioMachine(profile.equipment);

  if (cardio) {
    return {
      label,
      type: 'cardio',
      exercises: CARDIO_MACHINE_CONDITIONING.map((e) => ({
        ...e,
        scheme: {
          ...e.scheme,
          reps: `${Math.min(45, profile.sessionDurationMinutes)} min`,
        },
      })),
    };
  }

  // Fallback: walking-pace bodyweight circuit
  return {
    label,
    type: 'cardio',
    exercises: [
      {
        exerciseId: 'mountain-climbers',
        scheme: { sets: 3, reps: '20s', restSeconds: 40 },
        notes: 'W1-W2: Easy pace, 20s on | W3: 25s on | W4: Deload 15s | W5-W6: 25s | W7: 30s | W8: 30s',
      },
      {
        exerciseId: 'plank',
        scheme: { sets: 3, reps: '30-45s', restSeconds: 30 },
        notes: 'W1-W2: 30s | W3: 40s | W4: Deload 20s | W5-W6: 40s | W7: 50s | W8: 60s',
      },
    ],
  };
}

/**
 * Build a metabolic circuit day.
 * Best for general fitness and athletes with moderate training age.
 */
function buildCircuitDay(profile: UserTrainingProfile, label: string): TrainingDay {
  const kb = hasKettlebell(profile.equipment);

  const exercises: ProgramExercise[] = [
    {
      exerciseId: 'box-jump',
      scheme: { sets: 3, reps: '8', restSeconds: 30 },
      notes: 'W1-W2: 6 reps | W3: 8 reps | W4: Deload 4 reps | W5-W6: 8 reps | W7: 10 reps | W8: Max height',
    },
    {
      exerciseId: 'mountain-climbers',
      scheme: { sets: 3, reps: '30s', restSeconds: 30 },
      notes: 'W1-W2: 20s | W3: 30s | W4: Deload 15s | W5-W6: 30s | W7: 40s | W8: 45s',
    },
    ...(kb ? KETTLEBELL_CONDITIONING : []),
    {
      exerciseId: 'plank',
      scheme: { sets: 3, reps: '30-45s', restSeconds: 30 },
      notes: 'W1-W2: 30s | W3: 40s | W4: Deload 20s | W5-W6: 40s | W7: 50s | W8: 60s',
    },
  ];

  return { label, type: 'cardio', exercises };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive the best conditioning modality from the user's training profile.
 */
export function deriveConditioningProfile(profile: UserTrainingProfile): ConditioningProfile {
  const goal = profile.goals[0] ?? 'general-fitness';
  const isNovice = profile.trainingAgeYears < 1;
  const isFatLoss = goal === 'fat-loss';
  const durationMinutes = Math.min(40, Math.max(15, Math.round(profile.sessionDurationMinutes * 0.6)));

  let modality: ConditioningProfile['modality'];
  let intensityLevel: ConditioningProfile['intensityLevel'];

  if (isNovice) {
    modality = 'liss';
    intensityLevel = 'low';
  } else if (isFatLoss) {
    modality = 'hiit';
    intensityLevel = 'high';
  } else {
    modality = 'circuit';
    intensityLevel = 'moderate';
  }

  return {
    modality,
    durationMinutes,
    intensityLevel,
    equipment: profile.equipment,
  };
}

/**
 * Generate a complete conditioning `TrainingDay` for insertion into a program
 * schedule.  Label the day appropriately (e.g. "Day 4 — Conditioning").
 */
export function buildConditioningDay(
  profile: UserTrainingProfile,
  dayIndex: number,
  conditioningProfile?: ConditioningProfile,
): TrainingDay {
  const cp = conditioningProfile ?? deriveConditioningProfile(profile);
  const label = `Day ${dayIndex} — Conditioning`;

  switch (cp.modality) {
    case 'hiit':
    case 'emom':
    case 'intervals':
      return buildHiitDay(profile, label);
    case 'liss':
      return buildLissDay(profile, label);
    case 'circuit':
    default:
      return buildCircuitDay(profile, label);
  }
}
