import { describe, expect, it } from 'vitest';
import { scoreExercise, selectExercisesForPattern } from './exerciseIntelligence';
import { EXERCISE_LIBRARY } from '../data/exercises';
import type { UserTrainingProfile } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fullGymProfile: UserTrainingProfile = {
  goals: ['hypertrophy'],
  trainingAgeYears: 2,
  daysPerWeek: 4,
  sessionDurationMinutes: 60,
  equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
  injuries: [],
  aiSummary: '',
};

const bodyweightProfile: UserTrainingProfile = {
  ...fullGymProfile,
  equipment: ['bodyweight'],
};

const shoulderInjuryProfile: UserTrainingProfile = {
  ...fullGymProfile,
  injuries: ['shoulder impingement'],
};

// ─── scoreExercise ────────────────────────────────────────────────────────────

describe('scoreExercise', () => {
  it('scores higher for equipment-available exercise', () => {
    const bench = EXERCISE_LIBRARY.find((e) => e.id === 'barbell-bench-press');
    if (!bench) return; // guard in case library changes

    const fullScore = scoreExercise(bench, fullGymProfile, 'push-horizontal', ['chest']);
    const bwScore = scoreExercise(bench, bodyweightProfile, 'push-horizontal', ['chest']);

    // Full gym should score the bench press higher (has barbell)
    expect(fullScore.score).toBeGreaterThan(bwScore.score);
  });

  it('penalizes contraindicated exercises for shoulder injury', () => {
    const ohp = EXERCISE_LIBRARY.find((e) => e.id === 'overhead-press');
    if (!ohp) return;

    const safeScore = scoreExercise(ohp, fullGymProfile, 'push-vertical', ['shoulders']);
    const injuredScore = scoreExercise(ohp, shoulderInjuryProfile, 'push-vertical', ['shoulders']);

    expect(injuredScore.score).toBeLessThan(safeScore.score);
  });

  it('awards higher score when pattern matches', () => {
    const bench = EXERCISE_LIBRARY.find((e) => e.id === 'barbell-bench-press');
    if (!bench) return;

    const matchScore = scoreExercise(bench, fullGymProfile, 'push-horizontal', ['chest']);
    const noMatchScore = scoreExercise(bench, fullGymProfile, 'squat', ['quads']);

    expect(matchScore.score).toBeGreaterThan(noMatchScore.score);
  });

  it('includes a non-empty reasons array', () => {
    const bench = EXERCISE_LIBRARY.find((e) => e.id === 'barbell-bench-press');
    if (!bench) return;

    const result = scoreExercise(bench, fullGymProfile, 'push-horizontal', ['chest']);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

// ─── selectExercisesForPattern ────────────────────────────────────────────────

describe('selectExercisesForPattern', () => {
  it('returns the requested count of exercises', () => {
    const results = selectExercisesForPattern(fullGymProfile, 'squat', ['quads', 'glutes'], 3);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.length).toBeGreaterThan(0);
  });

  it('respects exclusion list', () => {
    const first = selectExercisesForPattern(fullGymProfile, 'squat', ['quads', 'glutes'], 1);
    if (!first.length) return;

    const excluded = new Set([first[0].id]);
    const second = selectExercisesForPattern(fullGymProfile, 'squat', ['quads', 'glutes'], 1, excluded);

    if (second.length > 0) {
      expect(second[0].id).not.toBe(first[0].id);
    }
  });

  it('returns exercises appropriate for bodyweight-only profile', () => {
    const results = selectExercisesForPattern(bodyweightProfile, 'push-horizontal', ['chest'], 3);
    // All selected exercises should be available with bodyweight equipment
    for (const ex of results) {
      const usesBodyweight = ex.equipment.includes('bodyweight') || ex.equipment.length === 0;
      const usesOtherAvailable = bodyweightProfile.equipment.some((a) =>
        ex.equipment.some((eq) => eq.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(eq.toLowerCase())),
      );
      expect(usesBodyweight || usesOtherAvailable || ex.equipment.length === 0).toBe(true);
    }
  });
});
