import { describe, expect, it } from 'vitest';
import type { Exercise } from '../types';
import { filterExercises } from './exerciseSearch';

const MOCK_EXERCISES: Exercise[] = [
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
    exerciseVariants: ['barbell-bench-press'],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable'],
    instructions: [],
    tips: [],
    pattern: 'pull-vertical',
    difficulty: 'beginner',
  },
  {
    id: 'biceps-curl',
    name: 'Biceps Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['back'],
    equipment: ['dumbbell'],
    instructions: [],
    tips: [],
    pattern: 'isolation',
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
    difficulty: 'intermediate',
  },
];

describe('filterExercises', () => {
  it('treats whitespace-only query as empty', () => {
    const result = filterExercises(MOCK_EXERCISES, { query: '   ' });
    expect(result).toHaveLength(4);
  });

  it('matches against secondary muscles and equipment', () => {
    const bySecondary = filterExercises(MOCK_EXERCISES, { query: 'triceps' });
    expect(bySecondary.map((e) => e.id)).toEqual(['push-up']);

    const byEquipment = filterExercises(MOCK_EXERCISES, { query: 'cable' });
    expect(byEquipment.map((e) => e.id)).toEqual(['lat-pulldown']);
  });

  it('prioritizes name-prefix matches before other matches', () => {
    const result = filterExercises(MOCK_EXERCISES, { query: 'bi' });
    expect(result[0].id).toBe('biceps-curl');
  });

  it('resolves RDL abbreviation alias', () => {
    const result = filterExercises(MOCK_EXERCISES, { query: 'rdl' });
    expect(result.map((e) => e.id)).toContain('romanian-deadlift');
  });

  it('handles fuzzy/typo matching (trigram)', () => {
    // "bicepss" should still match "Biceps Curl" via trigram similarity
    const result = filterExercises(MOCK_EXERCISES, { query: 'bicepss' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('biceps-curl');
  });

  it('filters by movement pattern', () => {
    const result = filterExercises(MOCK_EXERCISES, { pattern: 'hinge' });
    expect(result.map((e) => e.id)).toEqual(['romanian-deadlift']);
  });

  it('filters by difficulty', () => {
    const result = filterExercises(MOCK_EXERCISES, { difficulty: 'intermediate' });
    expect(result.map((e) => e.id)).toEqual(['romanian-deadlift']);
  });
});
