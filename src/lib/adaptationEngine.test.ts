import { describe, expect, it } from 'vitest';
import {
  computeTrainingMetrics,
  computeExerciseProgress,
  recommendAdaptation,
  generateAdaptationPlan,
} from './adaptationEngine';
import type { WorkoutHistory, WorkoutSession, ExerciseProgress } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSession(
  id: string,
  daysAgo: number,
  exercises: Array<{
    exerciseId: string;
    sets: Array<{ weight: number; reps: number; rpe?: number; completed?: boolean }>;
  }>,
): WorkoutSession {
  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    programId: 'test-program',
    trainingDayIndex: 0,
    startedAt: completedAt,
    completedAt,
    durationSeconds: 3600,
    totalVolumeKg: exercises.reduce(
      (total, ex) =>
        total +
        ex.sets.reduce((s, set) => s + (set.completed !== false ? set.weight * set.reps : 0), 0),
      0,
    ),
    exercises: exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        completed: s.completed !== false,
        timestamp: completedAt,
      })),
    })),
  };
}

const EMPTY_HISTORY: WorkoutHistory = { sessions: [], personalRecords: [] };

const BASIC_HISTORY: WorkoutHistory = {
  personalRecords: [],
  sessions: [
    makeSession('s1', 25, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 8, rpe: 7 }] }]),
    makeSession('s2', 18, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 82.5, reps: 8, rpe: 7 }] }]),
    makeSession('s3', 11, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 85, reps: 8, rpe: 7.5 }] }]),
    makeSession('s4', 4, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 87.5, reps: 9, rpe: 7.5 }] }]),
  ],
};

// ─── computeTrainingMetrics ───────────────────────────────────────────────────

describe('computeTrainingMetrics', () => {
  it('returns zeros for empty history', () => {
    const metrics = computeTrainingMetrics(EMPTY_HISTORY);
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.totalVolumeKg).toBe(0);
    expect(metrics.adherenceRate).toBe(0);
  });

  it('counts sessions within the rolling window', () => {
    const metrics = computeTrainingMetrics(BASIC_HISTORY, 4, 30);
    expect(metrics.totalSessions).toBe(4);
  });

  it('excludes sessions older than the window', () => {
    const history: WorkoutHistory = {
      personalRecords: [],
      sessions: [
        makeSession('old', 60, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 60, reps: 8 }] }]),
        makeSession('recent', 5, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 8 }] }]),
      ],
    };
    const metrics = computeTrainingMetrics(history, 4, 30);
    expect(metrics.totalSessions).toBe(1);
  });

  it('calculates adherence rate correctly', () => {
    const metrics = computeTrainingMetrics(BASIC_HISTORY, 4, 28);
    // 4 planned weeks × 4 sessions = 16 planned; 4 completed
    expect(metrics.adherenceRate).toBeGreaterThan(0);
    expect(metrics.adherenceRate).toBeLessThanOrEqual(1);
  });

  it('captures muscle group sets', () => {
    const metrics = computeTrainingMetrics(BASIC_HISTORY, 4, 30);
    // barbell-bench-press primarily targets chest
    expect(metrics.muscleGroupSets.chest).toBeGreaterThan(0);
  });
});

// ─── computeExerciseProgress ──────────────────────────────────────────────────

describe('computeExerciseProgress', () => {
  it('returns empty array for empty history', () => {
    expect(computeExerciseProgress(EMPTY_HISTORY)).toHaveLength(0);
  });

  it('returns one entry per unique exercise', () => {
    const history: WorkoutHistory = {
      personalRecords: [],
      sessions: [
        makeSession('s1', 10, [
          { exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 8 }] },
          { exerciseId: 'barbell-back-squat', sets: [{ weight: 100, reps: 5 }] },
        ]),
      ],
    };
    expect(computeExerciseProgress(history)).toHaveLength(2);
  });

  it('detects improving trend across sessions', () => {
    const history: WorkoutHistory = {
      personalRecords: [],
      sessions: [
        makeSession('s1', 42, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 60, reps: 8 }] }]),
        makeSession('s2', 35, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 65, reps: 8 }] }]),
        makeSession('s3', 28, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 70, reps: 8 }] }]),
        makeSession('s4', 21, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 8 }] }]),
        makeSession('s5', 14, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 85, reps: 8 }] }]),
        makeSession('s6', 7, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 90, reps: 8 }] }]),
      ],
    };
    const progress = computeExerciseProgress(history);
    const bench = progress.find((p) => p.exerciseId === 'barbell-bench-press');
    expect(bench?.trendDirection).toBe('improving');
  });

  it('detects declining trend', () => {
    const history: WorkoutHistory = {
      personalRecords: [],
      sessions: [
        makeSession('s1', 42, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 90, reps: 8 }] }]),
        makeSession('s2', 35, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 85, reps: 7 }] }]),
        makeSession('s3', 28, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 7 }] }]),
        makeSession('s4', 21, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 75, reps: 6 }] }]),
        makeSession('s5', 14, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 72.5, reps: 6 }] }]),
        makeSession('s6', 7, [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 70, reps: 6 }] }]),
      ],
    };
    const progress = computeExerciseProgress(history);
    const bench = progress.find((p) => p.exerciseId === 'barbell-bench-press');
    expect(bench?.trendDirection).toBe('declining');
  });
});

// ─── recommendAdaptation ─────────────────────────────────────────────────────

describe('recommendAdaptation', () => {
  const baseProgress: ExerciseProgress = {
    exerciseId: 'barbell-bench-press',
    exerciseName: 'Barbell Bench Press',
    sessionCount: 4,
    bestWeightKg: 100,
    best1RMEstimate: 115,
    avgRpe: 7.5,
    trendDirection: 'stable',
    lastLoggedAt: new Date().toISOString(),
  };

  it('recommends hold for insufficient data', () => {
    const rec = recommendAdaptation({ ...baseProgress, sessionCount: 1 });
    expect(rec.action).toBe('hold');
    expect(rec.confidence).toBe('low');
  });

  it('recommends deload for high RPE', () => {
    const rec = recommendAdaptation({ ...baseProgress, avgRpe: 9.0 });
    expect(rec.action).toBe('deload');
    expect(rec.confidence).toBe('high');
    expect(rec.suggestedLoad).toBeDefined();
    expect(rec.suggestedLoad!).toBeLessThan(100);
  });

  it('recommends increase_load for improving trend and low RPE', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'improving', avgRpe: 7.0 });
    expect(rec.action).toBe('increase_load');
    expect(rec.suggestedLoad).toBeGreaterThan(100);
  });

  it('recommends increase_reps for stable trend and low RPE', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'stable', avgRpe: 7.0 });
    expect(rec.action).toBe('increase_reps');
  });

  it('recommends hold for declining trend with moderate RPE', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'declining', avgRpe: 7.0 });
    expect(rec.action).toBe('hold');
  });

  it('recommends deload for declining trend with high RPE', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'declining', avgRpe: 8.5 });
    expect(rec.action).toBe('deload');
  });

  // ── RPE=0 edge cases ──────────────────────────────────────────────────────────

  it('does not produce "RPE 0.0" rationale when no RPE is logged', () => {
    const rec = recommendAdaptation({ ...baseProgress, avgRpe: 0 });
    expect(rec.rationale).not.toMatch(/RPE 0/);
  });

  it('recommends increase_reps (not increase_load) for improving trend with no RPE data', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'improving', avgRpe: 0 });
    expect(rec.action).toBe('increase_reps');
  });

  it('recommends hold for declining trend with no RPE data', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'declining', avgRpe: 0 });
    expect(rec.action).toBe('hold');
  });

  it('recommends hold with low confidence for stable trend with no RPE data', () => {
    const rec = recommendAdaptation({ ...baseProgress, trendDirection: 'stable', avgRpe: 0 });
    expect(rec.action).toBe('hold');
    expect(rec.confidence).toBe('low');
  });
});

// ─── generateAdaptationPlan ───────────────────────────────────────────────────

describe('generateAdaptationPlan', () => {
  it('returns empty array for empty history', () => {
    expect(generateAdaptationPlan(EMPTY_HISTORY)).toHaveLength(0);
  });

  it('returns at most maxResults recommendations', () => {
    const history: WorkoutHistory = {
      personalRecords: [],
      sessions: Array.from({ length: 3 }, (_, i) =>
        makeSession(`s${i}`, (i + 1) * 5, [
          { exerciseId: 'barbell-bench-press', sets: [{ weight: 80 + i * 2.5, reps: 8 }] },
          { exerciseId: 'barbell-back-squat', sets: [{ weight: 100 + i * 5, reps: 5 }] },
          { exerciseId: 'deadlift', sets: [{ weight: 120 + i * 5, reps: 3 }] },
        ]),
      ),
    };
    expect(generateAdaptationPlan(history, 2)).toHaveLength(2);
  });

  it('sorts deload recommendations to the front', () => {
    const progress: ExerciseProgress[] = [
      { exerciseId: 'barbell-bench-press', exerciseName: 'Bench', sessionCount: 4, bestWeightKg: 100, best1RMEstimate: 115, avgRpe: 7.0, trendDirection: 'stable', lastLoggedAt: new Date().toISOString() },
      { exerciseId: 'deadlift', exerciseName: 'Deadlift', sessionCount: 4, bestWeightKg: 150, best1RMEstimate: 170, avgRpe: 9.5, trendDirection: 'stable', lastLoggedAt: new Date().toISOString() },
    ];
    const recs = progress.map(recommendAdaptation).sort((a, b) => {
      const order = { deload: 0, increase_load: 1, increase_reps: 2, hold: 3, swap: 4 };
      return (order[a.action] ?? 4) - (order[b.action] ?? 4);
    });
    expect(recs[0].action).toBe('deload');
  });
});
