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
  },
];

describe('filterExercises', () => {
  it('treats whitespace-only query as empty', () => {
    const result = filterExercises(MOCK_EXERCISES, { query: '   ' });
    expect(result).toHaveLength(3);
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
});
