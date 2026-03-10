import type { WorkoutSession, User, WeightUnit } from '../types';
import type { InsightRequest } from './claudeService';
import { getExerciseNameMap } from '../lib/staticCatalogs';

/** Builds a compact, plain-text workout summary for the Claude prompt. */
export async function buildInsightRequest(
  sessions: WorkoutSession[],
  user: User,
  weightUnit: WeightUnit = 'kg',
): Promise<InsightRequest | null> {
  // Limit to last 28 days, most recent first, max 20 sessions
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);

  const recent = sessions
    .filter((s) => s.completedAt && new Date(s.startedAt) >= cutoff)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, 20);

  if (recent.length === 0) return null;

  const exerciseIds = Array.from(
    new Set(recent.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId))),
  );
  const nameOf = await getExerciseNameMap(exerciseIds);

  const totalVolume = recent.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const avgVolume = Math.round(totalVolume / recent.length);

  const displayFactor = weightUnit === 'lbs' ? 2.2046226218 : 1;
  const sessionLines = recent.map((s) => {
    const date = new Date(s.startedAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const duration = s.durationSeconds
      ? `${Math.round(s.durationSeconds / 60)} min`
      : 'unknown duration';
    const volume = `${Math.round(s.totalVolumeKg * displayFactor)} ${weightUnit}`;
    const topExercises = s.exercises
      .slice(0, 3)
      .map((e) => nameOf[e.exerciseId] ?? e.exerciseId)
      .join(', ');
    return `${date}: ${volume} volume, ${duration} — ${topExercises}`;
  });

  const summary = [
    `Sessions in last 4 weeks: ${recent.length}`,
    `Average session volume: ${Math.round(avgVolume * displayFactor)} ${weightUnit}`,
    '',
    'Session log (most recent first):',
    ...sessionLines,
  ].join('\n');

  return {
    userGoal: user.goal,
    userExperience: user.experienceLevel,
    workoutSummary: summary,
  };
}
