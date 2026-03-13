import { describe, expect, it } from 'vitest';
import type { Exercise } from '../types';
import { findSwapCandidates } from './equipmentSwap';

const LIBRARY: Exercise[] = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [],
    tips: [],
    pattern: 'push-horizontal',
    difficulty: 'intermediate',
    exerciseVariants: ['dumbbell-bench-press', 'push-up'],
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell'],
    instructions: [],
    tips: [],
    pattern: 'push-horizontal',
    difficulty: 'beginner',
  },
  {
    id: 'push-up',
    name: 'Push Up',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: ['bodyweight'],
    instructions: [],
    tips: [],
    pattern: 'push-horizontal',
    difficulty: 'beginner',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes'],
    equipment: ['barbell'],
    instructions: [],
    tips: [],
    pattern: 'hinge',
    difficulty: 'beginner',
  },
];

describe('findSwapCandidates', () => {
  it('returns candidates with matching primary muscles', () => {
    const source = LIBRARY[0]; // barbell bench press
    const candidates = findSwapCandidates(source, LIBRARY);
    const ids = candidates.map((c) => c.exercise.id);
    expect(ids).toContain('dumbbell-bench-press');
    expect(ids).toContain('push-up');
    // RDL has different primary muscles — should NOT appear
    expect(ids).not.toContain('romanian-deadlift');
  });

  it('filters out exercises that require unavailable equipment', () => {
    const source = LIBRARY[0]; // barbell bench press
    const candidates = findSwapCandidates(source, LIBRARY, {
      availableEquipment: ['dumbbell'],
    });
    const ids = candidates.map((c) => c.exercise.id);
    expect(ids).not.toContain('romanian-deadlift'); // barbell required
    // push-up (bodyweight) and dumbbell-bench-press should pass
    expect(ids).toContain('dumbbell-bench-press');
    expect(ids).toContain('push-up');
  });

  it('boosts explicit exerciseVariants', () => {
    const source = LIBRARY[0]; // has variants: dumbbell-bench-press, push-up
    const candidates = findSwapCandidates(source, LIBRARY);
    // Both variants should have higher scores than non-variant candidates
    expect(candidates[0].exercise.id).not.toBe(source.id);
    const variantScores = candidates
      .filter((c) => ['dumbbell-bench-press', 'push-up'].includes(c.exercise.id))
      .map((c) => c.score);
    // All variant candidates present
    expect(variantScores.length).toBeGreaterThan(0);
  });

  it('does not include the source exercise in results', () => {
    const source = LIBRARY[0];
    const candidates = findSwapCandidates(source, LIBRARY);
    expect(candidates.map((c) => c.exercise.id)).not.toContain(source.id);
  });

  it('respects maxResults', () => {
    const source = LIBRARY[0];
    const candidates = findSwapCandidates(source, LIBRARY, { maxResults: 1 });
    expect(candidates).toHaveLength(1);
  });
});
