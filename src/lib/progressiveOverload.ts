/**
 * Progressive Overload Engine
 *
 * Implements ACSM (2009) resistance-training progression guidance:
 *   - When a user completes 1–2 more reps than the top of the target range
 *     at similar effort, increase load by 2–10 % (default 5 %).
 *   - When reps fall short of the bottom of the target range, hold or deload.
 *   - RPE / RIR signals are used to modulate the recommendation.
 *
 * All logic is pure and deterministic so it can run client-side or be called
 * from a server-side API route.
 */

import type { ProgressionAction, ProgressionRecommendation } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetRecord {
  setNumber: number;
  weight: number;       // kg or lbs — unit agnostic
  reps: number;
  completed: boolean;
  /** Rate of Perceived Exertion (1–10 Borg-derived scale) */
  rpe?: number;
}

export interface ExerciseSetHistory {
  exerciseId: string;
  exerciseName: string;
  /** Target rep range parsed from the program scheme (e.g. "8-10") */
  targetRepsMin: number;
  targetRepsMax: number;
  /** Sets logged in the most recent session */
  recentSets: SetRecord[];
  /** Top-set weight from the previous session (for load comparison) */
  previousTopLoadKg?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "8", "8-10", or "8–12" into [min, max]. */
export function parseRepRange(scheme: string): [number, number] {
  const cleaned = scheme.trim().replace('–', '-');
  const parts = cleaned.split('-').map((s) => parseInt(s, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  const single = parseInt(cleaned, 10);
  if (!isNaN(single)) return [single, single];
  return [8, 12]; // safe default
}

/**
 * Round to the nearest `increment`.
 * Default is 1.25 kg (the smallest standard metric plate).
 * Pass 2.5 for lb-based tracking or larger increments for lighter exercises.
 */
function roundToIncrement(value: number, increment = 1.25): number {
  return Math.round(value / increment) * increment;
}

function averageRpe(sets: SetRecord[]): number | undefined {
  const rpeSets = sets.filter((s) => s.completed && s.rpe !== undefined);
  if (rpeSets.length === 0) return undefined;
  return rpeSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rpeSets.length;
}

function topLoad(sets: SetRecord[]): number {
  return sets.filter((s) => s.completed).reduce((max, s) => Math.max(max, s.weight), 0);
}

function averageReps(sets: SetRecord[]): number {
  const completed = sets.filter((s) => s.completed);
  if (completed.length === 0) return 0;
  return completed.reduce((sum, s) => sum + s.reps, 0) / completed.length;
}

// ─── Core recommendation logic ────────────────────────────────────────────────

/**
 * Produce a progression recommendation for a single exercise.
 *
 * ACSM rules applied:
 *  1. If avg reps > targetMax + 1 AND avg RPE ≤ 8 → increase load 2–10 %
 *  2. If avg reps ≥ targetMin AND avg reps ≤ targetMax → hold or +1 rep cue
 *  3. If avg reps < targetMin → hold load (address technique first)
 *  4. If avg RPE > 9 consistently → deload
 */
export function recommendProgression(history: ExerciseSetHistory): ProgressionRecommendation {
  const { exerciseId, exerciseName, targetRepsMin, targetRepsMax, recentSets, previousTopLoadKg } = history;

  const avgReps = averageReps(recentSets);
  const avgRpe = averageRpe(recentSets);
  const currentLoad = topLoad(recentSets);

  // Guard: no completed sets
  if (currentLoad === 0) {
    return {
      exerciseId,
      exerciseName,
      action: 'hold',
      currentLoad,
      reason: 'No completed sets recorded.',
      confidence: 'low',
    };
  }

  // Rule 4: consistently high RPE → deload
  if (avgRpe !== undefined && avgRpe >= 9.5) {
    return {
      exerciseId,
      exerciseName,
      action: 'deload',
      currentLoad,
      suggestedLoad: roundToIncrement(currentLoad * 0.9),
      reason: `Average RPE ${avgRpe.toFixed(1)} signals excessive fatigue — reduce load by ~10 %.`,
      confidence: 'high',
    };
  }

  // Rule 1: over-performance → increase load (ACSM 2–10 %, using 5 % default)
  if (avgReps > targetRepsMax + 1 && (avgRpe === undefined || avgRpe <= 8)) {
    const loadIncreasePct = avgRpe !== undefined && avgRpe <= 6 ? 0.10 : 0.05;
    const raw = currentLoad * (1 + loadIncreasePct);
    const suggestedLoad = roundToIncrement(raw);
    const prevDelta =
      previousTopLoadKg !== undefined ? ` (was ${previousTopLoadKg} kg)` : '';
    return {
      exerciseId,
      exerciseName,
      action: 'increase_load',
      currentLoad,
      suggestedLoad,
      reason: `You averaged ${avgReps.toFixed(1)} reps (target ${targetRepsMin}–${targetRepsMax}) — increase load to ${suggestedLoad} kg${prevDelta}.`,
      confidence: avgRpe !== undefined ? 'high' : 'medium',
    };
  }

  // Rule 2: hit the target range cleanly → add a rep cue
  if (avgReps >= targetRepsMin && avgReps <= targetRepsMax) {
    const rpeNote =
      avgRpe !== undefined ? ` RPE ${avgRpe.toFixed(1)} — effort is well-managed.` : '';
    return {
      exerciseId,
      exerciseName,
      action: 'increase_reps',
      currentLoad,
      reason: `Solid performance (avg ${avgReps.toFixed(1)} reps in range).${rpeNote} Aim for ${Math.min(targetRepsMax + 1, targetRepsMax + 2)} next session before loading up.`,
      confidence: 'medium',
    };
  }

  // Rule 3: below target → hold load
  return {
    exerciseId,
    exerciseName,
    action: 'hold',
    currentLoad,
    reason: `Average ${avgReps.toFixed(1)} reps fell below target (${targetRepsMin}). Keep the load and focus on full range of motion.`,
    confidence: 'medium',
  };
}

/**
 * Convenience wrapper: generate recommendations for multiple exercises from a
 * single workout session.
 */
export function recommendProgressionBatch(
  histories: ExerciseSetHistory[],
): ProgressionRecommendation[] {
  return histories.map(recommendProgression);
}

/** Return a CSS-friendly colour token for a given progression action. */
export function progressionActionColour(action: ProgressionAction): string {
  const map: Record<ProgressionAction, string> = {
    increase_load: 'text-green-600 dark:text-green-400',
    increase_reps: 'text-blue-600 dark:text-blue-400',
    hold: 'text-yellow-600 dark:text-yellow-400',
    deload: 'text-red-600 dark:text-red-400',
  };
  return map[action];
}
