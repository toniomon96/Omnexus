import { describe, expect, it } from 'vitest';
import { parseRepRange, recommendProgression } from './progressiveOverload';
import type { ExerciseSetHistory } from './progressiveOverload';

describe('parseRepRange', () => {
  it('parses "8-10"', () => {
    expect(parseRepRange('8-10')).toEqual([8, 10]);
  });

  it('parses "8–12" (em-dash)', () => {
    expect(parseRepRange('8–12')).toEqual([8, 12]);
  });

  it('parses a single number "8"', () => {
    expect(parseRepRange('8')).toEqual([8, 8]);
  });

  it('falls back to [8,12] for garbage input', () => {
    expect(parseRepRange('?')).toEqual([8, 12]);
  });
});

describe('recommendProgression', () => {
  const baseHistory: ExerciseSetHistory = {
    exerciseId: 'barbell-bench-press',
    exerciseName: 'Barbell Bench Press',
    targetRepsMin: 8,
    targetRepsMax: 10,
    recentSets: [],
  };

  it('returns hold when there are no completed sets', () => {
    const rec = recommendProgression(baseHistory);
    expect(rec.action).toBe('hold');
    expect(rec.confidence).toBe('low');
  });

  it('recommends increase_load when reps exceed target and RPE is low', () => {
    const history: ExerciseSetHistory = {
      ...baseHistory,
      recentSets: [
        { setNumber: 1, weight: 80, reps: 12, completed: true, rpe: 7 },
        { setNumber: 2, weight: 80, reps: 12, completed: true, rpe: 7 },
        { setNumber: 3, weight: 80, reps: 12, completed: true, rpe: 7 },
      ],
    };
    const rec = recommendProgression(history);
    expect(rec.action).toBe('increase_load');
    expect(rec.suggestedLoad).toBeGreaterThan(80);
  });

  it('recommends deload when RPE >= 9.5', () => {
    const history: ExerciseSetHistory = {
      ...baseHistory,
      recentSets: [
        { setNumber: 1, weight: 100, reps: 8, completed: true, rpe: 10 },
        { setNumber: 2, weight: 100, reps: 8, completed: true, rpe: 9.5 },
      ],
    };
    const rec = recommendProgression(history);
    expect(rec.action).toBe('deload');
    expect(rec.suggestedLoad).toBeLessThan(100);
  });

  it('recommends increase_reps when within target range', () => {
    const history: ExerciseSetHistory = {
      ...baseHistory,
      recentSets: [
        { setNumber: 1, weight: 80, reps: 9, completed: true, rpe: 8 },
        { setNumber: 2, weight: 80, reps: 9, completed: true, rpe: 8 },
        { setNumber: 3, weight: 80, reps: 9, completed: true, rpe: 8 },
      ],
    };
    const rec = recommendProgression(history);
    expect(rec.action).toBe('increase_reps');
  });

  it('recommends hold when below target range', () => {
    const history: ExerciseSetHistory = {
      ...baseHistory,
      recentSets: [
        { setNumber: 1, weight: 80, reps: 6, completed: true, rpe: 9 },
        { setNumber: 2, weight: 80, reps: 6, completed: true, rpe: 9 },
      ],
    };
    const rec = recommendProgression(history);
    expect(rec.action).toBe('hold');
  });
});
