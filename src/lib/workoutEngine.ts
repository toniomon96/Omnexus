/**
 * Workout Engine
 *
 * A fully deterministic, evidence-based program generator.  Produces complete
 * 8-week periodized training programs without any AI calls.
 *
 * Architecture:
 *   1. Program Structure Engine — selects split, number of days, day types
 *   2. Exercise Selection Engine — via exerciseIntelligence.ts
 *   3. Volume Allocation Engine — distributes sets by goal and muscle priority
 *   4. Conditioning Integration  — via conditioningEngine.ts
 *   5. Progression Note Builder — generates W1–W8 coaching notes per exercise
 *
 * All logic is pure and runs client-side or server-side.
 */

import type {
  Program,
  TrainingDay,
  ProgramExercise,
  SetScheme,
  UserTrainingProfile,
  MovementPattern,
  MuscleGroup,
  DayType,
  Exercise,
} from '../types';
import { buildConditioningDay, deriveConditioningProfile } from './conditioningEngine';
import { buildSessionExercises } from './exerciseIntelligence';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAM_DURATION_WEEKS = 8;

// ─── Program Structure Engine ─────────────────────────────────────────────────

type ProgramSplit = 'full-body' | 'upper-lower' | 'push-pull-legs';

function selectSplit(profile: UserTrainingProfile): ProgramSplit {
  const style = profile.programStyle;

  if (style === 'full-body') return 'full-body';
  if (style === 'upper-lower') return 'upper-lower';
  if (style === 'push-pull-legs') return 'push-pull-legs';

  // Auto-select by days per week
  if (profile.daysPerWeek <= 3) return 'full-body';
  if (profile.daysPerWeek === 4) return 'upper-lower';
  return 'push-pull-legs';
}

interface DayTemplate {
  type: DayType;
  label: string;
  isConditioning: boolean;
}

function buildDayTemplates(
  split: ProgramSplit,
  daysPerWeek: number,
  includeCardio: boolean,
): DayTemplate[] {
  const days: DayTemplate[] = [];
  const conditioning: DayTemplate = { type: 'cardio', label: 'Conditioning', isConditioning: true };

  if (split === 'full-body') {
    const liftingDays = includeCardio ? Math.max(2, daysPerWeek - 1) : daysPerWeek;
    for (let i = 0; i < liftingDays; i++) {
      days.push({ type: 'full-body', label: i % 2 === 0 ? 'Full Body A' : 'Full Body B', isConditioning: false });
    }
    if (includeCardio) days.push(conditioning);
    return days;
  }

  if (split === 'upper-lower') {
    const liftingDays = includeCardio ? Math.max(2, daysPerWeek - 1) : daysPerWeek;
    const templates: DayTemplate[] = [
      { type: 'upper', label: 'Upper A — Strength', isConditioning: false },
      { type: 'lower', label: 'Lower A — Quad Dominant', isConditioning: false },
      { type: 'upper', label: 'Upper B — Volume', isConditioning: false },
      { type: 'lower', label: 'Lower B — Hip Dominant', isConditioning: false },
    ];
    for (let i = 0; i < liftingDays; i++) {
      days.push(templates[i % templates.length]);
    }
    if (includeCardio) days.push(conditioning);
    return days;
  }

  // push-pull-legs
  const liftingDays = includeCardio ? Math.max(3, daysPerWeek - 1) : daysPerWeek;
  const templates: DayTemplate[] = [
    { type: 'push', label: 'Push', isConditioning: false },
    { type: 'pull', label: 'Pull', isConditioning: false },
    { type: 'legs', label: 'Legs', isConditioning: false },
  ];
  for (let i = 0; i < liftingDays; i++) {
    days.push(templates[i % templates.length]);
  }
  if (includeCardio) days.push(conditioning);
  return days;
}

// ─── Volume Allocation Engine ─────────────────────────────────────────────────

interface PatternTarget {
  pattern: MovementPattern;
  muscles: MuscleGroup[];
}

/** Sets per session for a given exercise role, tuned by goal. */
function setsForRole(
  role: 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core',
  goal: string,
): number {
  const table: Record<typeof role, Record<string, number>> = {
    primary_compound: { hypertrophy: 4, 'fat-loss': 3, 'general-fitness': 3 },
    secondary_compound: { hypertrophy: 4, 'fat-loss': 3, 'general-fitness': 3 },
    accessory: { hypertrophy: 3, 'fat-loss': 3, 'general-fitness': 3 },
    isolation: { hypertrophy: 3, 'fat-loss': 2, 'general-fitness': 2 },
    core: { hypertrophy: 3, 'fat-loss': 3, 'general-fitness': 3 },
  };
  return table[role][goal] ?? table[role]['general-fitness'];
}

/** Rest seconds for a given exercise role and goal. */
function restForRole(
  role: 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core',
  goal: string,
): number {
  if (goal === 'fat-loss') {
    return { primary_compound: 90, secondary_compound: 75, accessory: 60, isolation: 45, core: 30 }[role] ?? 60;
  }
  return { primary_compound: 180, secondary_compound: 120, accessory: 90, isolation: 60, core: 45 }[role] ?? 90;
}

/** Rep range string for a given exercise role and goal. */
function repsForRole(
  role: 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core',
  goal: string,
): string {
  if (goal === 'hypertrophy') {
    return { primary_compound: '6-8', secondary_compound: '8-10', accessory: '10-12', isolation: '12-15', core: '10-15' }[role] ?? '8-12';
  }
  if (goal === 'fat-loss') {
    return { primary_compound: '10-12', secondary_compound: '12-15', accessory: '12-15', isolation: '15-20', core: '15-20' }[role] ?? '12-15';
  }
  return { primary_compound: '8-10', secondary_compound: '10-12', accessory: '10-12', isolation: '12-15', core: '10-15' }[role] ?? '8-12';
}

/** RPE target for a given exercise role. */
function rpeForRole(
  role: 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core',
): number {
  return { primary_compound: 8, secondary_compound: 7, accessory: 7, isolation: 7, core: 6 }[role] ?? 7;
}

// ─── Progression Note Builder ─────────────────────────────────────────────────

/**
 * Generate a complete W1-W8 progression note string for an exercise.
 * Follows the linear periodization model used throughout the app.
 */
function buildProgressionNote(
  role: 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core',
  goal: string,
): string {
  const isCompound = role === 'primary_compound' || role === 'secondary_compound';

  if (isCompound && goal !== 'fat-loss') {
    return [
      'W1: 3×10 @RPE7',
      'W2: 4×8 @RPE7',
      'W3: 4×8 @RPE8',
      'W4: Deload 2×10 @RPE6',
      'W5: 4×8 @RPE8',
      'W6: 4×6 @RPE8',
      'W7: 5×5 @RPE9',
      'W8: Test 5RM or deload',
    ].join(' | ');
  }

  if (isCompound && goal === 'fat-loss') {
    return [
      'W1: 3×12 @RPE6',
      'W2: 3×12 @RPE7',
      'W3: 4×10 @RPE7',
      'W4: Deload 2×12 @RPE6',
      'W5: 4×10 @RPE7',
      'W6: 4×10 @RPE8',
      'W7: 4×8 @RPE8',
      'W8: Test top set or deload',
    ].join(' | ');
  }

  if (role === 'isolation' || role === 'accessory') {
    return [
      'W1: 3×12 @RPE6',
      'W2: 3×12 @RPE7',
      'W3: 3×12 @RPE7',
      'W4: Deload 2×12 @RPE6',
      'W5: 3×12 @RPE8',
      'W6: 3×10 @RPE8',
      'W7: 4×10 @RPE8',
      'W8: 4×10 @RPE8 or +weight',
    ].join(' | ');
  }

  // core
  return [
    'W1: 3×30s @RPE6',
    'W2: 3×35s @RPE6',
    'W3: 3×40s @RPE7',
    'W4: Deload 2×25s @RPE5',
    'W5: 3×40s @RPE7',
    'W6: 3×45s @RPE8',
    'W7: 4×45s @RPE8',
    'W8: 4×60s or harder variation',
  ].join(' | ');
}

// ─── Day builders ─────────────────────────────────────────────────────────────

type ExerciseRole = 'primary_compound' | 'secondary_compound' | 'accessory' | 'isolation' | 'core';

interface SlotDefinition {
  patterns: PatternTarget[];
  role: ExerciseRole;
}

function buildProgramExercise(
  exercise: Exercise,
  role: ExerciseRole,
  goal: string,
): ProgramExercise {
  const scheme: SetScheme = {
    sets: setsForRole(role, goal),
    reps: repsForRole(role, goal),
    restSeconds: restForRole(role, goal),
    rpe: rpeForRole(role),
  };
  return {
    exerciseId: exercise.id,
    scheme,
    notes: buildProgressionNote(role, goal),
  };
}

const FULL_BODY_A_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'squat', muscles: ['quads', 'glutes'] }] },
  { role: 'primary_compound', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'pull-horizontal', muscles: ['back', 'lats'] }] },
  { role: 'accessory', patterns: [{ pattern: 'push-vertical', muscles: ['shoulders'] }] },
  { role: 'accessory', patterns: [{ pattern: 'hinge', muscles: ['hamstrings', 'glutes'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core', 'abs'] }] },
];

const FULL_BODY_B_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'hinge', muscles: ['hamstrings', 'glutes'] }] },
  { role: 'primary_compound', patterns: [{ pattern: 'pull-vertical', muscles: ['back', 'lats'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'squat', muscles: ['quads'] }] },
  { role: 'accessory', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['shoulders', 'side-deltoid'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core', 'abs'] }] },
];

const UPPER_A_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'primary_compound', patterns: [{ pattern: 'pull-horizontal', muscles: ['back', 'lats'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'push-vertical', muscles: ['shoulders'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'pull-vertical', muscles: ['back', 'lats'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['side-deltoid', 'shoulders'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core', 'abs'] }] },
];

const UPPER_B_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'primary_compound', patterns: [{ pattern: 'pull-horizontal', muscles: ['back'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'push-vertical', muscles: ['shoulders'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'pull-vertical', muscles: ['lats'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['biceps'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['triceps'] }] },
];

const LOWER_A_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'squat', muscles: ['quads', 'glutes'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'hinge', muscles: ['hamstrings', 'glutes'] }] },
  { role: 'accessory', patterns: [{ pattern: 'squat', muscles: ['quads'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['quads'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['calves'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core', 'abs'] }] },
];

const LOWER_B_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'hinge', muscles: ['hamstrings', 'glutes'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'squat', muscles: ['glutes', 'quads'] }] },
  { role: 'accessory', patterns: [{ pattern: 'hinge', muscles: ['glutes', 'hamstrings'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['hamstrings'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['calves'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core'] }] },
];

const PUSH_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'push-vertical', muscles: ['shoulders'] }] },
  { role: 'accessory', patterns: [{ pattern: 'push-horizontal', muscles: ['chest'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['side-deltoid', 'shoulders'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['triceps'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['abs', 'core'] }] },
];

const PULL_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'pull-horizontal', muscles: ['back', 'lats'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'pull-vertical', muscles: ['lats', 'back'] }] },
  { role: 'accessory', patterns: [{ pattern: 'pull-horizontal', muscles: ['back'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['rear-deltoid', 'shoulders'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['biceps'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core', 'abs'] }] },
];

const LEGS_SLOTS: SlotDefinition[] = [
  { role: 'primary_compound', patterns: [{ pattern: 'squat', muscles: ['quads', 'glutes'] }] },
  { role: 'secondary_compound', patterns: [{ pattern: 'hinge', muscles: ['hamstrings', 'glutes'] }] },
  { role: 'accessory', patterns: [{ pattern: 'squat', muscles: ['quads', 'glutes'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['hamstrings'] }] },
  { role: 'isolation', patterns: [{ pattern: 'isolation', muscles: ['calves'] }] },
  { role: 'core', patterns: [{ pattern: 'isolation', muscles: ['core'] }] },
];

const SLOT_MAP: Record<string, SlotDefinition[]> = {
  'full-body-a': FULL_BODY_A_SLOTS,
  'full-body-b': FULL_BODY_B_SLOTS,
  'upper-a': UPPER_A_SLOTS,
  'upper-b': UPPER_B_SLOTS,
  'lower-a': LOWER_A_SLOTS,
  'lower-b': LOWER_B_SLOTS,
  push: PUSH_SLOTS,
  pull: PULL_SLOTS,
  legs: LEGS_SLOTS,
};

/** Shrink a slot list to target session count and duration. */
function trimSlots(
  slots: SlotDefinition[],
  sessionDurationMinutes: number,
): SlotDefinition[] {
  if (sessionDurationMinutes <= 45) return slots.slice(0, 4);
  if (sessionDurationMinutes <= 60) return slots.slice(0, 5);
  if (sessionDurationMinutes <= 75) return slots.slice(0, 6);
  return slots.slice(0, 7);
}

function buildLiftingDay(
  profile: UserTrainingProfile,
  templateKey: string,
  label: string,
  dayType: DayType,
  usedIds: Set<string>,
): TrainingDay {
  const goal = profile.goals[0] ?? 'general-fitness';
  const allSlots = SLOT_MAP[templateKey] ?? FULL_BODY_A_SLOTS;
  const slots = trimSlots(allSlots, profile.sessionDurationMinutes);
  const exercises: ProgramExercise[] = [];

  for (const slot of slots) {
    const patternTargets = slot.patterns;
    const exercises_for_slot = buildSessionExercises(profile, patternTargets, usedIds);
    if (exercises_for_slot.length === 0) continue;
    const ex = exercises_for_slot[0];
    exercises.push(buildProgramExercise(ex, slot.role, goal));
    // Don't mark core/isolation exercises as "used globally" — allow them to repeat across days
    if (slot.role !== 'core' && slot.role !== 'isolation') {
      usedIds.add(ex.id);
    }
  }

  return { label, type: dayType, exercises };
}

// ─── Program metadata builders ────────────────────────────────────────────────

function buildProgramName(split: ProgramSplit, goal: string, daysPerWeek: number): string {
  const splitName = {
    'full-body': 'Full Body',
    'upper-lower': 'Upper/Lower',
    'push-pull-legs': 'PPL',
  }[split];
  const goalLabel = goal === 'hypertrophy' ? 'Hypertrophy' : goal === 'fat-loss' ? 'Fat Loss' : 'Fitness';
  return `${daysPerWeek}-Day ${splitName} ${goalLabel} Program`;
}

function buildDescription(split: ProgramSplit, goal: string, daysPerWeek: number): string {
  return `A structured ${daysPerWeek}-day ${split.replace(/-/g, ' ')} program built for ${goal.replace(/-/g, ' ')}. ` +
    `8 weeks of linear periodization with a mandatory deload in Week 4 to maximize adaptation and reduce injury risk.`;
}

function buildTrainingPhilosophy(split: ProgramSplit, goal: string): string {
  const phaseNote = 'Weeks 1–3 build the volume base. Week 4 is a mandatory deload. Weeks 5–7 intensify the load. Week 8 is a peak or second deload.';
  if (goal === 'hypertrophy') {
    return `This ${split.replace(/-/g, ' ')} program targets hypertrophy through progressive mechanical tension. ${phaseNote}`;
  }
  if (goal === 'fat-loss') {
    return `This program pairs compound movements with short rest periods to maximize metabolic demand. ${phaseNote}`;
  }
  return `This balanced ${split.replace(/-/g, ' ')} program develops strength, movement quality, and body composition together. ${phaseNote}`;
}

const WEEKLY_PROGRESSION_NOTES = [
  'Week 1: Orientation — 3 sets, RPE 6-7. Focus entirely on form. Leave 3+ reps in the tank on every set.',
  'Week 2: Start pushing. Add a rep or 2.5 kg where Week 1 felt easy. Still RPE 7.',
  'Week 3: Add another set to main lifts (4 sets total). Push to RPE 7-8. Should feel challenging.',
  'Week 4: DELOAD — Drop to 2 sets on everything, reduce weight ~20%, RPE 6. Mandatory recovery. Do not skip.',
  'Week 5: Back to 4 sets, load heavier than Week 3. RPE 7-8. You should feel fresh and strong.',
  'Week 6: Increase weight on all main lifts. Target RPE 8 on working sets. Real gains happen here.',
  'Week 7: Peak week — 4-5 sets, RPE 8-9. Push hard. Best performances of the program here.',
  'Week 8: Choice — test your maxes on main lifts, or take a second deload before starting a new block.',
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a complete, deterministic 8-week training program.
 *
 * This is the primary entry point for the Workout Engine.  Pass the same
 * `UserTrainingProfile` used by the AI path — the output shape is identical
 * to the AI-generated `Program` type so it drops straight into the app.
 *
 * @param profile  - the user's training profile from onboarding
 * @param programId - optional; a unique ID to embed in the program (defaults to empty string)
 */
export function generateProgram(profile: UserTrainingProfile, programId = ''): Program {
  const goal = profile.goals[0] ?? 'general-fitness';
  const split = selectSplit(profile);
  const daysPerWeek = Math.min(Math.max(profile.daysPerWeek ?? 4, 2), 6);
  const includeCardio = profile.includeCardio ?? false;

  const dayTemplates = buildDayTemplates(split, daysPerWeek, includeCardio);
  const usedIdsPerDay: Set<string> = new Set();

  // Track alternating A/B counts for each day type
  const typeCounts: Record<string, number> = {};

  const schedule: TrainingDay[] = dayTemplates.slice(0, daysPerWeek).map((template, idx) => {
    if (template.isConditioning) {
      return buildConditioningDay(profile, idx + 1, deriveConditioningProfile(profile));
    }

    const typeKey = template.type;
    const count = typeCounts[typeKey] ?? 0;
    typeCounts[typeKey] = count + 1;
    const isB = count % 2 === 1;

    let templateKey: string;
    const label = `Day ${idx + 1} — ${template.label}`;

    if (typeKey === 'full-body') {
      templateKey = isB ? 'full-body-b' : 'full-body-a';
    } else if (typeKey === 'upper') {
      templateKey = isB ? 'upper-b' : 'upper-a';
    } else if (typeKey === 'lower') {
      templateKey = isB ? 'lower-b' : 'lower-a';
    } else {
      templateKey = typeKey; // push / pull / legs
    }

    return buildLiftingDay(profile, templateKey, label, typeKey, usedIdsPerDay);
  });

  const experienceLevel =
    profile.trainingAgeYears === 0 ? 'beginner'
    : profile.trainingAgeYears <= 2 ? 'intermediate'
    : 'advanced';

  return {
    id: programId,
    name: buildProgramName(split, goal, daysPerWeek),
    goal: goal as Program['goal'],
    experienceLevel: experienceLevel as Program['experienceLevel'],
    description: buildDescription(split, goal, daysPerWeek),
    trainingPhilosophy: buildTrainingPhilosophy(split, goal),
    weeklyProgressionNotes: WEEKLY_PROGRESSION_NOTES,
    daysPerWeek,
    estimatedDurationWeeks: PROGRAM_DURATION_WEEKS,
    schedule,
    tags: ['deterministic', split, goal],
    isCustom: false,
    isAiGenerated: false,
    aiLifecycleStatus: 'active',
    createdAt: new Date().toISOString(),
  };
}
