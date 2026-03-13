import type { Equipment, Exercise, ExperienceLevel, MovementPattern, MuscleGroup } from '../types';

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

// ─── Trigram helpers ──────────────────────────────────────────────────────────

/** Build the set of 3-character n-grams for a string. */
function trigrams(str: string): Set<string> {
  const padded = `  ${str}  `;
  const result = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.slice(i, i + 3));
  }
  return result;
}

/**
 * Dice-coefficient similarity (0–1) between two strings using trigrams.
 * Equivalent to `pg_trgm` similarity on Postgres.
 */
function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tA = trigrams(a);
  const tB = trigrams(b);
  let shared = 0;
  for (const t of tA) {
    if (tB.has(t)) shared++;
  }
  return (2 * shared) / (tA.size + tB.size);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const TRIGRAM_SIMILARITY_THRESHOLD = 0.4;
const TRIGRAM_SCORE_MULTIPLIER = 60;

function scoreExercise(exercise: Exercise, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const name = exercise.name.toLowerCase();

  // Exact prefix / substring — highest priority
  if (name.startsWith(normalizedQuery)) return 100;
  if (name.includes(normalizedQuery)) return 75;

  // Common abbreviation aliases (e.g. "rdl" → romanian deadlift)
  const aliases: Record<string, string[]> = {
    rdl: ['romanian deadlift'],
    ohp: ['overhead press', 'shoulder press'],
    cgbp: ['close grip bench'],
    bb: ['barbell'],
    db: ['dumbbell'],
    kb: ['kettlebell'],
    bp: ['bench press'],
  };
  const aliasTargets = aliases[normalizedQuery];
  if (aliasTargets?.some((alias) => name.includes(alias))) return 90;

  // Trigram fuzzy match on exercise name (handles typos)
  const nameSimilarity = trigramSimilarity(normalizedQuery, name);
  if (nameSimilarity >= TRIGRAM_SIMILARITY_THRESHOLD) return Math.round(TRIGRAM_SCORE_MULTIPLIER * nameSimilarity);

  // Muscle / equipment / pattern metadata
  const primary = exercise.primaryMuscles.some((m) => m.toLowerCase().includes(normalizedQuery));
  if (primary) return 50;

  const secondary = exercise.secondaryMuscles.some((m) => m.toLowerCase().includes(normalizedQuery));
  if (secondary) return 35;

  const equipment = exercise.equipment.some((e) => e.toLowerCase().includes(normalizedQuery));
  if (equipment) return 20;

  const pattern = exercise.pattern?.toLowerCase().includes(normalizedQuery);
  if (pattern) return 15;

  return -1;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function filterExercises(
  items: Exercise[],
  params: {
    query?: string;
    muscle?: MuscleGroup | null;
    equipment?: Equipment | 'all';
    pattern?: MovementPattern | null;
    difficulty?: ExperienceLevel | null;
  } = {},
): Exercise[] {
  const normalizedQuery = normalizeQuery(params.query ?? '');
  const selectedMuscle = params.muscle ?? null;
  const selectedEquipment = params.equipment ?? 'all';
  const selectedPattern = params.pattern ?? null;
  const selectedDifficulty = params.difficulty ?? null;

  return items
    .map((exercise, index) => {
      const queryScore = scoreExercise(exercise, normalizedQuery);
      const matchesQuery = normalizedQuery.length === 0 || queryScore >= 0;
      const matchesMuscle =
        !selectedMuscle ||
        exercise.primaryMuscles.includes(selectedMuscle) ||
        exercise.secondaryMuscles.includes(selectedMuscle);
      const matchesEquipment = selectedEquipment === 'all' || exercise.equipment.includes(selectedEquipment);
      const matchesPattern = !selectedPattern || exercise.pattern === selectedPattern;
      const matchesDifficulty = !selectedDifficulty || exercise.difficulty === selectedDifficulty;

      return {
        exercise,
        queryScore,
        index,
        matches: matchesQuery && matchesMuscle && matchesEquipment && matchesPattern && matchesDifficulty,
      };
    })
    .filter((entry) => entry.matches)
    .sort((a, b) => {
      if (b.queryScore !== a.queryScore) return b.queryScore - a.queryScore;
      return a.index - b.index;
    })
    .map((entry) => entry.exercise);
}

