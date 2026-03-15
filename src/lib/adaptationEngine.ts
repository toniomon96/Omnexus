/**
 * Adaptation Engine
 *
 * Deterministic, evidence-based adaptation analysis.  Analyzes a user's
 * workout history and returns structured recommendations without any AI call.
 *
 * This complements the AI-powered /api/adapt endpoint:
 *  - Always available (no API key / quota needed)
 *  - Consistent, auditable output
 *  - Runs fully client-side
 *
 * Recommendation logic follows ACSM (2009) and the double-progression
 * protocol used in the rest of the app:
 *  1. Compute per-exercise metrics across recent sessions
 *  2. Classify performance trajectory (improving / stable / declining)
 *  3. Apply load/volume/recovery rules to emit recommendations
 */

import type {
  WorkoutSession,
  WorkoutHistory,
  UserTrainingMetrics,
  ExerciseProgress,
  AdaptationRecommendation,
  MuscleGroup,
} from '../types';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { estimate1RM } from '../utils/volumeUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const TREND_MIN_SESSIONS = 3;
const HIGH_RPE_THRESHOLD = 8.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exerciseName(exerciseId: string): string {
  return EXERCISE_LIBRARY.find((e) => e.id === exerciseId)?.name ?? exerciseId;
}

function avgOf(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function topLoad(session: WorkoutSession, exerciseId: string): number {
  const logged = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!logged) return 0;
  return logged.sets
    .filter((s) => s.completed)
    .reduce((max, s) => Math.max(max, s.weight), 0);
}

function avgRpeForExercise(session: WorkoutSession, exerciseId: string): number | null {
  const logged = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!logged) return null;
  const sets = logged.sets.filter((s) => s.completed && s.rpe != null);
  if (!sets.length) return null;
  return avgOf(sets.map((s) => s.rpe!));
}

function best1RMInSession(session: WorkoutSession, exerciseId: string): number {
  const logged = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!logged) return 0;
  return logged.sets
    .filter((s) => s.completed && s.weight > 0)
    .reduce((max, s) => Math.max(max, estimate1RM(s.weight, s.reps)), 0);
}

// ─── UserTrainingMetrics computation ─────────────────────────────────────────

/**
 * Compute aggregated training metrics over a rolling window (default 30 days).
 */
export function computeTrainingMetrics(
  history: WorkoutHistory,
  plannedSessionsPerWeek = 4,
  windowDays = 30,
): UserTrainingMetrics {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const sessions = history.sessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= cutoff,
  );

  const totalSessions = sessions.length;
  const plannedInWindow = Math.round((windowDays / 7) * plannedSessionsPerWeek);
  const adherenceRate = plannedInWindow > 0 ? Math.min(1, totalSessions / plannedInWindow) : 0;

  const totalVolumeKg = sessions.reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0);
  const avgSessionDurationMinutes = sessions.length
    ? avgOf(sessions.map((s) => (s.durationSeconds ?? 0) / 60))
    : 0;

  // Aggregate RPE
  const rpeValues: number[] = [];
  const muscleGroupSets: Partial<Record<MuscleGroup, number>> = {};
  let prCount = 0;

  for (const session of sessions) {
    for (const loggedEx of session.exercises) {
      for (const set of loggedEx.sets) {
        if (!set.completed) continue;
        if (set.rpe != null) rpeValues.push(set.rpe);
        if (set.isPersonalRecord) prCount++;
      }
      // Accumulate sets per muscle group
      const def = EXERCISE_LIBRARY.find((e) => e.id === loggedEx.exerciseId);
      if (def) {
        for (const muscle of def.primaryMuscles) {
          const completedSets = loggedEx.sets.filter((s) => s.completed).length;
          muscleGroupSets[muscle] = (muscleGroupSets[muscle] ?? 0) + completedSets;
        }
      }
    }
  }

  const periodStart = new Date(cutoff).toISOString();
  const periodEnd = new Date().toISOString();

  return {
    periodStart,
    periodEnd,
    totalSessions,
    adherenceRate,
    avgSessionDurationMinutes: Math.round(avgSessionDurationMinutes),
    totalVolumeKg: Math.round(totalVolumeKg),
    avgRpe: avgOf(rpeValues),
    prCount,
    muscleGroupSets,
  };
}

// ─── ExerciseProgress computation ────────────────────────────────────────────

/**
 * Compute per-exercise performance progress across all sessions.
 * Only includes exercises that appear in at least one session.
 */
export function computeExerciseProgress(history: WorkoutHistory): ExerciseProgress[] {
  const exerciseIds = new Set<string>(
    history.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)),
  );

  const result: ExerciseProgress[] = [];

  for (const exerciseId of exerciseIds) {
    const relevantSessions = history.sessions
      .filter((s) => s.completedAt && s.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    if (!relevantSessions.length) continue;

    const best1RMs = relevantSessions.map((s) => best1RMInSession(s, exerciseId));
    const rpeValues = relevantSessions
      .map((s) => avgRpeForExercise(s, exerciseId))
      .filter((v): v is number => v !== null);

    const bestWeightKg = relevantSessions.reduce((max, s) => Math.max(max, topLoad(s, exerciseId)), 0);
    const best1RMEstimate = Math.max(...best1RMs, 0);
    const lastSession = relevantSessions[relevantSessions.length - 1];

    // Trend: compare most recent 3 vs previous 3 sessions
    let trendDirection: ExerciseProgress['trendDirection'] = 'stable';
    if (relevantSessions.length >= TREND_MIN_SESSIONS * 2) {
      const recent = best1RMs.slice(-TREND_MIN_SESSIONS);
      const previous = best1RMs.slice(-TREND_MIN_SESSIONS * 2, -TREND_MIN_SESSIONS);
      const recentAvg = avgOf(recent);
      const previousAvg = avgOf(previous);
      const delta = recentAvg - previousAvg;
      const threshold = previousAvg * 0.02; // 2% change = significant
      if (delta > threshold) trendDirection = 'improving';
      else if (delta < -threshold) trendDirection = 'declining';
    } else if (best1RMs.length >= 2) {
      const first = best1RMs[0];
      const last = best1RMs[best1RMs.length - 1];
      trendDirection = last > first * 1.02 ? 'improving' : last < first * 0.98 ? 'declining' : 'stable';
    }

    result.push({
      exerciseId,
      exerciseName: exerciseName(exerciseId),
      sessionCount: relevantSessions.length,
      bestWeightKg,
      best1RMEstimate: Math.round(best1RMEstimate * 10) / 10,
      avgRpe: rpeValues.length ? Math.round(avgOf(rpeValues) * 10) / 10 : 0,
      trendDirection,
      lastLoggedAt: lastSession.completedAt ?? lastSession.startedAt,
    });
  }

  return result.sort((a, b) => b.sessionCount - a.sessionCount);
}

// ─── AdaptationRecommendation generation ─────────────────────────────────────

/**
 * Generate a single adaptation recommendation for an exercise from its
 * performance record.
 */
export function recommendAdaptation(progress: ExerciseProgress): AdaptationRecommendation {
  const { exerciseId, exerciseName, avgRpe, trendDirection, bestWeightKg, sessionCount } = progress;

  // Not enough data
  if (sessionCount < 2) {
    return {
      exerciseId,
      exerciseName,
      action: 'hold',
      rationale: 'Not enough data yet — complete at least 2 sessions to generate a recommendation.',
      confidence: 'low',
      category: 'load',
    };
  }

  // No RPE data logged — give trend-only advice without RPE gating
  const hasRpeData = avgRpe > 0;
  if (!hasRpeData) {
    if (trendDirection === 'improving') {
      return {
        exerciseId,
        exerciseName,
        action: 'increase_reps',
        rationale: 'Performance is trending upward. Start logging RPE to unlock personalized load recommendations.',
        confidence: 'medium',
        category: 'volume',
      };
    }
    if (trendDirection === 'declining') {
      return {
        exerciseId,
        exerciseName,
        action: 'hold',
        rationale: 'Performance is trending downward. Log RPE on your sets to help identify whether fatigue or technique is the limiting factor.',
        confidence: 'medium',
        category: 'technique',
      };
    }
    return {
      exerciseId,
      exerciseName,
      action: 'hold',
      rationale: 'Log RPE on your sets to unlock personalized load and volume recommendations.',
      confidence: 'low',
      category: 'load',
    };
  }

  // Consistently high RPE → deload
  if (avgRpe >= HIGH_RPE_THRESHOLD) {
    return {
      exerciseId,
      exerciseName,
      action: 'deload',
      suggestedLoad: Math.round(bestWeightKg * 0.9 * 4) / 4, // round to nearest 0.25
      rationale: `Average RPE ${avgRpe.toFixed(1)} signals accumulated fatigue. Reduce load by ~10% for one session.`,
      confidence: 'high',
      category: 'recovery',
    };
  }

  // Strong improving trend → increase load
  if (trendDirection === 'improving' && avgRpe <= 8) {
    const increase = avgRpe <= 6.5 ? 0.10 : 0.05;
    const newLoad = Math.round(bestWeightKg * (1 + increase) * 4) / 4;
    return {
      exerciseId,
      exerciseName,
      action: 'increase_load',
      suggestedLoad: newLoad,
      rationale: `Performance trending upward with RPE ${avgRpe.toFixed(1)}. Increase load by ~${Math.round(increase * 100)}% next session.`,
      confidence: avgRpe < 7 ? 'high' : 'medium',
      category: 'load',
    };
  }

  // Declining trend → investigate or hold
  if (trendDirection === 'declining') {
    return {
      exerciseId,
      exerciseName,
      action: avgRpe > 8 ? 'deload' : 'hold',
      rationale: `Performance trending downward. ${avgRpe > 8 ? 'High RPE suggests fatigue — consider a deload.' : 'Hold the current load and focus on technique.'}`,
      confidence: 'medium',
      category: avgRpe > 8 ? 'recovery' : 'technique',
    };
  }

  // Stable and controllable → increase reps
  if (trendDirection === 'stable' && avgRpe <= 7.5) {
    return {
      exerciseId,
      exerciseName,
      action: 'increase_reps',
      rationale: `Performance is stable with manageable RPE ${avgRpe.toFixed(1)}. Add 1–2 reps before progressing load.`,
      confidence: 'medium',
      category: 'volume',
    };
  }

  // Default: hold
  return {
    exerciseId,
    exerciseName,
    action: 'hold',
    rationale: 'Maintain current load and focus on consistent execution.',
    confidence: 'medium',
    category: 'load',
  };
}

/**
 * Generate adaptation recommendations for all tracked exercises.
 *
 * @param history       - full workout history
 * @param maxResults    - cap output at this many recommendations (default 10)
 */
export function generateAdaptationPlan(
  history: WorkoutHistory,
  maxResults = 10,
): AdaptationRecommendation[] {
  const progress = computeExerciseProgress(history);
  return progress
    .slice(0, maxResults)
    .map(recommendAdaptation)
    .sort((a, b) => {
      // Surface high-priority items first: deload > increase_load > increase_reps > hold
      const order = { deload: 0, increase_load: 1, increase_reps: 2, hold: 3, swap: 4 };
      return (order[a.action] ?? 4) - (order[b.action] ?? 4);
    });
}
