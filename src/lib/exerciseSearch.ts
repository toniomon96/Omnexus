import type { Equipment, Exercise, MuscleGroup } from '../types';

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreExercise(exercise: Exercise, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const name = exercise.name.toLowerCase();
  if (name.startsWith(normalizedQuery)) return 100;
  if (name.includes(normalizedQuery)) return 70;

  const primary = exercise.primaryMuscles.some((m) => m.toLowerCase().includes(normalizedQuery));
  if (primary) return 50;

  const secondary = exercise.secondaryMuscles.some((m) => m.toLowerCase().includes(normalizedQuery));
  if (secondary) return 35;

  const equipment = exercise.equipment.some((e) => e.toLowerCase().includes(normalizedQuery));
  if (equipment) return 20;

  return -1;
}

export function filterExercises(
  items: Exercise[],
  params: {
    query?: string;
    muscle?: MuscleGroup | null;
    equipment?: Equipment | 'all';
  } = {},
): Exercise[] {
  const normalizedQuery = normalizeQuery(params.query ?? '');
  const selectedMuscle = params.muscle ?? null;
  const selectedEquipment = params.equipment ?? 'all';

  return items
    .map((exercise, index) => {
      const queryScore = scoreExercise(exercise, normalizedQuery);
      const matchesQuery = normalizedQuery.length === 0 || queryScore >= 0;
      const matchesMuscle =
        !selectedMuscle ||
        exercise.primaryMuscles.includes(selectedMuscle) ||
        exercise.secondaryMuscles.includes(selectedMuscle);
      const matchesEquipment = selectedEquipment === 'all' || exercise.equipment.includes(selectedEquipment);

      return {
        exercise,
        queryScore,
        index,
        matches: matchesQuery && matchesMuscle && matchesEquipment,
      };
    })
    .filter((entry) => entry.matches)
    .sort((a, b) => {
      if (b.queryScore !== a.queryScore) return b.queryScore - a.queryScore;
      return a.index - b.index;
    })
    .map((entry) => entry.exercise);
}
