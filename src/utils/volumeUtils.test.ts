import { describe, it, expect } from 'vitest';
import { estimate1RM, calculateTotalVolume, getExerciseProgressionData, getWeeklyVolumeByMuscle, countSessionsLast30Days, getTotalWeeklyVolumeKg, getAvgRpeRecent } from './volumeUtils';
import type { WorkoutSession, WorkoutHistory } from '../types';

// ─── estimate1RM ─────────────────────────────────────────────────────────────

describe('estimate1RM', () => {
  it('returns weight directly for a single rep', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('calculates Epley formula for multiple reps', () => {
    // 100 * (1 + 5/30) = 100 * 1.1667 ≈ 116.67
    expect(estimate1RM(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('returns higher 1RM for more reps at same weight', () => {
    expect(estimate1RM(80, 10)).toBeGreaterThan(estimate1RM(80, 5));
  });
});

// ─── calculateTotalVolume ────────────────────────────────────────────────────

function makeSession(sets: Array<{ weight: number; reps: number; completed: boolean }>): WorkoutSession {
  return {
    id: 'test',
    programId: 'prog',
    trainingDayIndex: 0,
    startedAt: new Date().toISOString(),
    exercises: [
      {
        exerciseId: 'ex1',
        sets: sets.map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed,
          timestamp: '',
        })),
      },
    ],
    totalVolumeKg: 0,
  };
}

describe('calculateTotalVolume', () => {
  it('sums weight × reps for completed sets only', () => {
    const session = makeSession([
      { weight: 100, reps: 5, completed: true },   // 500
      { weight: 100, reps: 5, completed: true },   // 500
      { weight: 80, reps: 8, completed: false },   // 0 (not completed)
    ]);
    expect(calculateTotalVolume(session)).toBe(1000);
  });

  it('returns 0 for empty session', () => {
    const session = makeSession([]);
    expect(calculateTotalVolume(session)).toBe(0);
  });

  it('returns 0 if no sets are completed', () => {
    const session = makeSession([
      { weight: 100, reps: 5, completed: false },
    ]);
    expect(calculateTotalVolume(session)).toBe(0);
  });
});

// ─── getExerciseProgressionData ───────────────────────────────────────────────

describe('getExerciseProgressionData', () => {
  const history: WorkoutHistory = {
    sessions: [
      {
        id: 's1',
        programId: 'prog',
        trainingDayIndex: 0,
        startedAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T11:00:00Z',
        exercises: [
          {
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, weight: 80, reps: 8, completed: true, timestamp: '' },
              { setNumber: 2, weight: 80, reps: 6, completed: true, timestamp: '' },
            ],
          },
        ],
        totalVolumeKg: 1120,
      },
      {
        id: 's2',
        programId: 'prog',
        trainingDayIndex: 0,
        startedAt: '2025-01-08T10:00:00Z',
        completedAt: '2025-01-08T11:00:00Z',
        exercises: [
          {
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, weight: 85, reps: 8, completed: true, timestamp: '' },
            ],
          },
        ],
        totalVolumeKg: 680,
      },
    ],
    personalRecords: [],
  };

  it('returns one data point per session that includes the exercise', () => {
    const data = getExerciseProgressionData('bench', history);
    expect(data).toHaveLength(2);
  });

  it('returns max weight for each session', () => {
    const data = getExerciseProgressionData('bench', history);
    expect(data[0].maxWeightKg).toBe(80);
    expect(data[1].maxWeightKg).toBe(85);
  });

  it('returns empty array for exercise with no history', () => {
    const data = getExerciseProgressionData('squat', history);
    expect(data).toHaveLength(0);
  });

  it('sorts data points chronologically', () => {
    const data = getExerciseProgressionData('bench', history);
    expect(new Date(data[0].date).getTime()).toBeLessThan(new Date(data[1].date).getTime());
  });
});

// ─── getWeeklyVolumeByMuscle ──────────────────────────────────────────────────

describe('getWeeklyVolumeByMuscle', () => {
  it('returns arrays with length equal to the weeks parameter', () => {
    const result = getWeeklyVolumeByMuscle({ sessions: [], personalRecords: [] }, 3);
    for (const vol of Object.values(result)) {
      expect(vol).toHaveLength(3);
    }
  });

  it('defaults to 4 weeks when no weeks argument is provided', () => {
    const result = getWeeklyVolumeByMuscle({ sessions: [], personalRecords: [] });
    for (const vol of Object.values(result)) {
      expect(vol).toHaveLength(4);
    }
  });

  it('returns all zeros for empty sessions', () => {
    const result = getWeeklyVolumeByMuscle({ sessions: [], personalRecords: [] }, 4);
    for (const vol of Object.values(result)) {
      expect(vol.every((v) => v === 0)).toBe(true);
    }
  });

  it('excludes sessions that fall outside the time window', () => {
    const oldSession: WorkoutSession = {
      id: 's-old',
      programId: 'prog',
      trainingDayIndex: 0,
      // 100 weeks ago — well outside any reasonable window
      startedAt: new Date(Date.now() - 100 * 7 * 24 * 60 * 60 * 1000).toISOString(),
      exercises: [
        {
          exerciseId: 'barbell-back-squat',
          sets: [{ setNumber: 1, weight: 100, reps: 10, completed: true, timestamp: '' }],
        },
      ],
      totalVolumeKg: 1000,
    };
    const result = getWeeklyVolumeByMuscle({ sessions: [oldSession], personalRecords: [] }, 4);
    for (const vol of Object.values(result)) {
      expect(vol.every((v) => v === 0)).toBe(true);
    }
  });

  it('returns a result object that includes all expected muscle group keys', () => {
    const result = getWeeklyVolumeByMuscle({ sessions: [], personalRecords: [] });
    const expectedMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio'];
    for (const muscle of expectedMuscles) {
      expect(result).toHaveProperty(muscle);
    }
  });
});

// ─── Helpers for new stat functions ──────────────────────────────────────────

function makeCompletedSession(
  daysAgo: number,
  sets: Array<{ weight: number; reps: number; rpe?: number }>,
): WorkoutSession {
  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `s-${daysAgo}`,
    programId: 'prog',
    trainingDayIndex: 0,
    startedAt: completedAt,
    completedAt,
    exercises: [
      {
        exerciseId: 'ex1',
        sets: sets.map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          completed: true,
          timestamp: completedAt,
        })),
      },
    ],
    totalVolumeKg: sets.reduce((t, s) => t + s.weight * s.reps, 0),
  };
}

// ─── countSessionsLast30Days ─────────────────────────────────────────────────

describe('countSessionsLast30Days', () => {
  it('counts sessions completed within the last 30 days', () => {
    const sessions = [
      makeCompletedSession(5, [{ weight: 100, reps: 5 }]),
      makeCompletedSession(20, [{ weight: 80, reps: 8 }]),
      makeCompletedSession(29, [{ weight: 60, reps: 10 }]),
    ];
    expect(countSessionsLast30Days(sessions)).toBe(3);
  });

  it('excludes sessions older than 30 days', () => {
    const sessions = [
      makeCompletedSession(31, [{ weight: 100, reps: 5 }]),
      makeCompletedSession(60, [{ weight: 80, reps: 8 }]),
    ];
    expect(countSessionsLast30Days(sessions)).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(countSessionsLast30Days([])).toBe(0);
  });

  it('excludes sessions that have no completedAt', () => {
    const incomplete: WorkoutSession = {
      id: 'inc',
      programId: 'prog',
      trainingDayIndex: 0,
      startedAt: new Date().toISOString(),
      exercises: [],
      totalVolumeKg: 0,
    };
    expect(countSessionsLast30Days([incomplete])).toBe(0);
  });
});

// ─── getTotalWeeklyVolumeKg ──────────────────────────────────────────────────

describe('getTotalWeeklyVolumeKg', () => {
  it('sums volume for sessions within the last 7 days', () => {
    const sessions = [
      makeCompletedSession(2, [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }]), // 1000
      makeCompletedSession(6, [{ weight: 80, reps: 10 }]),                             // 800
    ];
    expect(getTotalWeeklyVolumeKg(sessions)).toBe(1800);
  });

  it('excludes sessions older than 7 days', () => {
    const sessions = [
      makeCompletedSession(8, [{ weight: 100, reps: 10 }]),
    ];
    expect(getTotalWeeklyVolumeKg(sessions)).toBe(0);
  });

  it('returns 0 for empty sessions', () => {
    expect(getTotalWeeklyVolumeKg([])).toBe(0);
  });
});

// ─── getAvgRpeRecent ─────────────────────────────────────────────────────────

describe('getAvgRpeRecent', () => {
  it('averages RPE across all sets in the last 30 days', () => {
    const sessions = [
      makeCompletedSession(3, [{ weight: 100, reps: 5, rpe: 7 }, { weight: 100, reps: 5, rpe: 9 }]),
    ];
    // (7 + 9) / 2 = 8
    expect(getAvgRpeRecent(sessions)).toBe(8);
  });

  it('returns 0 when no sets have RPE data', () => {
    const sessions = [
      makeCompletedSession(3, [{ weight: 100, reps: 5 }]),
    ];
    expect(getAvgRpeRecent(sessions)).toBe(0);
  });

  it('returns 0 for empty sessions', () => {
    expect(getAvgRpeRecent([])).toBe(0);
  });

  it('respects the custom days parameter', () => {
    const sessions = [
      makeCompletedSession(3, [{ weight: 100, reps: 5, rpe: 8 }]),
      makeCompletedSession(10, [{ weight: 100, reps: 5, rpe: 6 }]),
    ];
    // With days=7, only the first session counts → avg = 8
    expect(getAvgRpeRecent(sessions, 7)).toBe(8);
    // With days=14, both count → avg = 7
    expect(getAvgRpeRecent(sessions, 14)).toBe(7);
  });
});
