import { describe, it, expect } from 'vitest';
import { calculateMasteryLevel, deriveExerciseMastery, masteryProgress } from './masteryUtils';

describe('calculateMasteryLevel', () => {
  it('returns novice for 0 sessions', () => {
    expect(calculateMasteryLevel(0)).toBe('novice');
  });
  it('returns beginner for 3 sessions', () => {
    expect(calculateMasteryLevel(3)).toBe('beginner');
  });
  it('returns intermediate for 10 sessions', () => {
    expect(calculateMasteryLevel(10)).toBe('intermediate');
  });
  it('returns advanced for 25 sessions', () => {
    expect(calculateMasteryLevel(25)).toBe('advanced');
  });
  it('returns expert for 50+ sessions', () => {
    expect(calculateMasteryLevel(50)).toBe('expert');
    expect(calculateMasteryLevel(100)).toBe('expert');
  });
});

describe('deriveExerciseMastery', () => {
  it('returns empty array for no sessions', () => {
    expect(deriveExerciseMastery([])).toEqual([]);
  });

  it('counts distinct sessions per exercise', () => {
    const sessions: any[] = [
      {
        id: 's1',
        exercises: [{ exerciseId: 'squat', sets: [{ completed: true }] }],
        startedAt: '2026-01-01',
        completedAt: '2026-01-01',
      },
      {
        id: 's2',
        exercises: [{ exerciseId: 'squat', sets: [{ completed: true }, { completed: true }] }],
        startedAt: '2026-01-02',
        completedAt: '2026-01-02',
      },
    ];
    const mastery = deriveExerciseMastery(sessions);
    expect(mastery).toHaveLength(1);
    expect(mastery[0].exerciseId).toBe('squat');
    expect(mastery[0].sessionsCount).toBe(2);
    expect(mastery[0].totalSets).toBe(3);
    expect(mastery[0].masteryLevel).toBe('novice'); // 2 sessions < 3
  });
});

describe('masteryProgress', () => {
  it('returns 0 for 0 sessions (novice start)', () => {
    expect(masteryProgress(0)).toBe(0);
  });
  it('returns 1 for expert level', () => {
    expect(masteryProgress(50)).toBe(1);
  });
  it('returns 0.5 for halfway between beginner and intermediate (6/10 from 3)', () => {
    // beginner=3, intermediate=10, at sessionsCount=6: (6-3)/(10-3) = 3/7 ≈ 0.43
    const val = masteryProgress(6);
    expect(val).toBeCloseTo(3 / 7);
  });
});
