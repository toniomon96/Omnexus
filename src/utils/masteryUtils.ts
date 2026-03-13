import type { WorkoutSession, ExerciseMastery, MasteryLevel } from '../types';

export function calculateMasteryLevel(sessionsCount: number): MasteryLevel {
  if (sessionsCount >= 50) return 'expert';
  if (sessionsCount >= 25) return 'advanced';
  if (sessionsCount >= 10) return 'intermediate';
  if (sessionsCount >= 3) return 'beginner';
  return 'novice';
}

export const MASTERY_THRESHOLDS: Record<MasteryLevel, number> = {
  novice: 0,
  beginner: 3,
  intermediate: 10,
  advanced: 25,
  expert: 50,
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  novice: 'Novice',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const MASTERY_ICONS: Record<MasteryLevel, string> = {
  novice: '🔘',
  beginner: '🥉',
  intermediate: '🥈',
  advanced: '🥇',
  expert: '🏆',
};

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  novice: 'text-zinc-400',
  beginner: 'text-amber-600',
  intermediate: 'text-zinc-300',
  advanced: 'text-yellow-400',
  expert: 'text-emerald-400',
};

/**
 * Derives exercise mastery data from a user's workout history.
 */
export function deriveExerciseMastery(sessions: WorkoutSession[]): ExerciseMastery[] {
  const exerciseMap = new Map<string, { sessions: Set<string>; totalSets: number }>();

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const entry = exerciseMap.get(ex.exerciseId) ?? { sessions: new Set(), totalSets: 0 };
      entry.sessions.add(session.id);
      entry.totalSets += ex.sets.filter(s => s.completed).length;
      exerciseMap.set(ex.exerciseId, entry);
    }
  }

  const result: ExerciseMastery[] = [];
  for (const [exerciseId, data] of exerciseMap.entries()) {
    const sessionsCount = data.sessions.size;
    result.push({
      exerciseId,
      sessionsCount,
      totalSets: data.totalSets,
      masteryLevel: calculateMasteryLevel(sessionsCount),
    });
  }

  return result.sort((a, b) => b.sessionsCount - a.sessionsCount);
}

/**
 * Returns mastery progress toward the next level (0–1).
 */
export function masteryProgress(sessionsCount: number): number {
  const level = calculateMasteryLevel(sessionsCount);
  if (level === 'expert') return 1;

  const levels: MasteryLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
  const currentIdx = levels.indexOf(level);
  const nextLevel = levels[currentIdx + 1];
  const currentThreshold = MASTERY_THRESHOLDS[level];
  const nextThreshold = MASTERY_THRESHOLDS[nextLevel];

  return (sessionsCount - currentThreshold) / (nextThreshold - currentThreshold);
}
