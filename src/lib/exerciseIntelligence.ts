/**
 * Exercise Intelligence System
 *
 * Deterministic exercise selection and scoring for the Workout Engine.
 * Selects the best exercises for a given movement pattern, goal, and
 * equipment profile — no AI calls required.
 *
 * Selection scoring (0–100):
 *   +30  Equipment perfectly available
 *   +20  Primary muscle group matches the target
 *   +15  Movement pattern matches the target
 *   +10  Goal-appropriate (e.g. compound for hypertrophy, multi-joint for fat-loss)
 *   +10  Experience-level appropriate
 *   +10  Injury-safe (no contraindications detected)
 *    −15  Equipment unavailable
 *    −20  Contraindicated by injury
 */

import type { Exercise, MovementPattern, MuscleGroup, UserTrainingProfile } from '../types';
import { EXERCISE_LIBRARY } from '../data/exercises';

// ─── Scoring weights ──────────────────────────────────────────────────────────

const SCORE_EQUIPMENT_MATCH = 30;
const SCORE_MUSCLE_MATCH = 20;
const SCORE_PATTERN_MATCH = 15;
const SCORE_GOAL_MATCH = 10;
const SCORE_LEVEL_MATCH = 10;
const SCORE_INJURY_SAFE = 10;
const PENALTY_EQUIPMENT_UNAVAILABLE = 15;
const PENALTY_CONTRAINDICATED = 20;

// ─── Injury → movement pattern contraindication map ─────────────────────────

const INJURY_CONTRAINDICATIONS: Record<string, MovementPattern[]> = {
  shoulder: ['push-vertical', 'push-horizontal'],
  back: ['hinge'],
  spine: ['hinge'],
  disc: ['hinge'],
  knee: ['squat'],
  patellar: ['squat'],
  meniscus: ['squat'],
  wrist: ['push-horizontal', 'push-vertical'],
  elbow: ['pull-horizontal', 'pull-vertical'],
};

// ─── Goal → preferred movement patterns ──────────────────────────────────────

const GOAL_PREFERRED_PATTERNS: Record<string, MovementPattern[]> = {
  hypertrophy: ['push-horizontal', 'push-vertical', 'pull-horizontal', 'pull-vertical', 'squat', 'hinge', 'isolation'],
  'fat-loss': ['push-horizontal', 'pull-horizontal', 'squat', 'hinge', 'cardio', 'carry'],
  'general-fitness': ['push-horizontal', 'pull-horizontal', 'squat', 'hinge', 'push-vertical', 'pull-vertical'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasEquipment(exercise: Exercise, available: string[]): boolean {
  if (!available.length) return true; // full gym assumed
  if (!exercise.equipment.length) return true; // bodyweight
  return exercise.equipment.some((eq) =>
    available.some((a) => a.toLowerCase().includes(eq.toLowerCase()) || eq.toLowerCase().includes(a.toLowerCase())),
  );
}

function isContraindicated(exercise: Exercise, injuries: string[]): boolean {
  if (!injuries.length || !exercise.pattern) return false;
  const injStr = injuries.join(' ').toLowerCase();
  for (const [injKey, patterns] of Object.entries(INJURY_CONTRAINDICATIONS)) {
    if (injStr.includes(injKey) && exercise.pattern && patterns.includes(exercise.pattern)) {
      return true;
    }
  }
  return false;
}

function isLevelAppropriate(exercise: Exercise, profile: UserTrainingProfile): boolean {
  if (!exercise.difficulty) return true;
  const age = profile.trainingAgeYears;
  if (exercise.difficulty === 'advanced' && age < 2) return false;
  if (exercise.difficulty === 'intermediate' && age === 0) return false;
  return true;
}

// ─── Core scoring function ────────────────────────────────────────────────────

export interface ScoredExercise {
  exercise: Exercise;
  score: number;
  reasons: string[];
}

/**
 * Score a single exercise against the user's profile and target criteria.
 */
export function scoreExercise(
  exercise: Exercise,
  profile: UserTrainingProfile,
  targetPattern?: MovementPattern,
  targetMuscles?: MuscleGroup[],
): ScoredExercise {
  let score = 0;
  const reasons: string[] = [];
  const goal = profile.goals[0] ?? 'general-fitness';

  // Equipment match
  if (hasEquipment(exercise, profile.equipment)) {
    score += SCORE_EQUIPMENT_MATCH;
    reasons.push('equipment available');
  } else {
    score -= PENALTY_EQUIPMENT_UNAVAILABLE;
    reasons.push('equipment unavailable');
  }

  // Injury check
  if (isContraindicated(exercise, profile.injuries)) {
    score -= PENALTY_CONTRAINDICATED;
    reasons.push('contraindicated by injury');
  } else if (profile.injuries.length > 0) {
    score += SCORE_INJURY_SAFE;
    reasons.push('injury-safe');
  }

  // Movement pattern match
  if (targetPattern && exercise.pattern === targetPattern) {
    score += SCORE_PATTERN_MATCH;
    reasons.push(`pattern matches (${targetPattern})`);
  }

  // Primary muscle match
  if (targetMuscles?.length) {
    const matchCount = targetMuscles.filter((m) => exercise.primaryMuscles.includes(m)).length;
    if (matchCount > 0) {
      score += SCORE_MUSCLE_MATCH * (matchCount / targetMuscles.length);
      reasons.push(`muscle match (${matchCount}/${targetMuscles.length})`);
    }
  }

  // Priority muscle bonus
  if (profile.priorityMuscles?.length) {
    const priorityHit = profile.priorityMuscles.some((pm) =>
      exercise.primaryMuscles.includes(pm as MuscleGroup),
    );
    if (priorityHit) {
      score += 5;
      reasons.push('hits priority muscle');
    }
  }

  // Goal match
  const preferredPatterns = GOAL_PREFERRED_PATTERNS[goal] ?? [];
  if (exercise.pattern && preferredPatterns.includes(exercise.pattern)) {
    score += SCORE_GOAL_MATCH;
    reasons.push(`goal-appropriate (${goal})`);
  }

  // Experience level
  if (isLevelAppropriate(exercise, profile)) {
    score += SCORE_LEVEL_MATCH;
    reasons.push('experience-appropriate');
  }

  return { exercise, score, reasons };
}

/**
 * Select the best N exercises for a given movement pattern and muscle target
 * from the full exercise library.
 */
export function selectExercisesForPattern(
  profile: UserTrainingProfile,
  targetPattern: MovementPattern,
  targetMuscles: MuscleGroup[],
  count: number,
  excludeIds: Set<string> = new Set(),
): Exercise[] {
  const candidates = EXERCISE_LIBRARY
    .filter((ex) => !excludeIds.has(ex.id))
    .map((ex) => scoreExercise(ex, profile, targetPattern, targetMuscles))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, count).map((s) => s.exercise);
}

/**
 * Select the single best exercise matching a pattern + muscles.
 * Returns undefined if no eligible exercise is found.
 */
export function selectBestExercise(
  profile: UserTrainingProfile,
  targetPattern: MovementPattern,
  targetMuscles: MuscleGroup[],
  excludeIds: Set<string> = new Set(),
): Exercise | undefined {
  return selectExercisesForPattern(profile, targetPattern, targetMuscles, 1, excludeIds)[0];
}

/**
 * Build a complete session exercise list from a desired movement pattern
 * sequence.  Deduplicates across calls when `usedIds` is provided.
 */
export function buildSessionExercises(
  profile: UserTrainingProfile,
  patternSequence: Array<{ pattern: MovementPattern; muscles: MuscleGroup[] }>,
  usedIds: Set<string> = new Set(),
): Exercise[] {
  const result: Exercise[] = [];

  for (const { pattern, muscles } of patternSequence) {
    const ex = selectBestExercise(profile, pattern, muscles, usedIds);
    if (ex) {
      result.push(ex);
      usedIds.add(ex.id);
    }
  }

  return result;
}
