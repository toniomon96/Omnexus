import type { MuscleGroup, WorkoutSession, User, WeightUnit } from '../types';
import type { InsightRequest } from './claudeService';
import { getExerciseSummaryMap } from '../lib/staticCatalogs';

const MAX_RECENT_SESSIONS = 10;
const MAX_MUSCLE_GROUPS = 5;
const MAX_STRENGTH_TRENDS = 5;

function formatDisplayWeight(weightKg: number, weightUnit: WeightUnit): string {
  const displayFactor = weightUnit === 'lbs' ? 2.2046226218 : 1;
  return `${Math.round(weightKg * displayFactor)} ${weightUnit}`;
}

function formatMuscleGroupLabel(muscle: MuscleGroup): string {
  return muscle
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

/** Builds a compact, plain-text workout summary for the Claude prompt. */
export async function buildInsightRequest(
  sessions: WorkoutSession[],
  user: User,
  weightUnit: WeightUnit = 'lbs',
): Promise<InsightRequest | null> {
  // Limit to last 28 days, most recent first, max 10 sessions.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);

  const recent = sessions
    .filter((s) => s.completedAt && new Date(s.startedAt) >= cutoff)
    .sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, MAX_RECENT_SESSIONS);

  if (recent.length === 0) return null;

  const exerciseIds = Array.from(
    new Set(recent.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId))),
  );
  const summaryOf = await getExerciseSummaryMap(exerciseIds);

  const totalVolume = recent.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const avgVolume = Math.round(totalVolume / recent.length);
  const weeklyFrequency = (recent.length / 4).toFixed(1);
  const recentSessionLines = recent.map((s) => {
    const date = new Date(s.startedAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const duration = s.durationSeconds
      ? `${Math.round(s.durationSeconds / 60)} min`
      : 'unknown duration';
    const volume = formatDisplayWeight(s.totalVolumeKg, weightUnit);
    const topExercises = s.exercises
      .slice(0, 3)
      .map((e) => summaryOf[e.exerciseId]?.name ?? e.exerciseId)
      .join(', ');
    return `${date}: ${volume} volume, ${duration} — ${topExercises}`;
  });

  const muscleFrequency = new Map<MuscleGroup, number>();
  const strengthTrends = new Map<string, { name: string; earliest: number; latest: number }>();

  for (const session of [...recent].reverse()) {
    const seenMuscles = new Set<MuscleGroup>();
    for (const exercise of session.exercises) {
      const summary = summaryOf[exercise.exerciseId];
      const completedSets = exercise.sets.filter((set) => set.completed && set.weight > 0 && set.reps > 0);
      const topWeight = completedSets.reduce((max, set) => Math.max(max, set.weight), 0);

      if (summary) {
        for (const muscle of summary.primaryMuscles) {
          seenMuscles.add(muscle);
        }
      }

      if (!summary || topWeight <= 0) continue;

      const existing = strengthTrends.get(exercise.exerciseId);
      if (!existing) {
        strengthTrends.set(exercise.exerciseId, {
          name: summary.name,
          earliest: topWeight,
          latest: topWeight,
        });
        continue;
      }

      existing.latest = topWeight;
    }

    for (const muscle of seenMuscles) {
      muscleFrequency.set(muscle, (muscleFrequency.get(muscle) ?? 0) + 1);
    }
  }

  const muscleFrequencyLines = [...muscleFrequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_MUSCLE_GROUPS)
    .map(([muscle, count]) => `- ${formatMuscleGroupLabel(muscle)}: ${count} session${count === 1 ? '' : 's'}`);

  const strengthProgressionLines = [...strengthTrends.values()]
    .map((trend) => ({
      ...trend,
      delta: trend.latest - trend.earliest,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name))
    .slice(0, MAX_STRENGTH_TRENDS)
    .map((trend) => {
      const latest = formatDisplayWeight(trend.latest, weightUnit);
      const earliest = formatDisplayWeight(trend.earliest, weightUnit);
      const delta = Math.round(Math.abs(trend.delta) * (weightUnit === 'lbs' ? 2.2046226218 : 1));

      if (trend.delta === 0) {
        return `- ${trend.name}: holding steady around ${latest}`;
      }

      const direction = trend.delta > 0 ? 'up' : 'down';
      return `- ${trend.name}: ${earliest} → ${latest} (${direction} ${delta} ${weightUnit})`;
    });

  const summary = [
    'Training Summary:',
    `- Sessions in last 4 weeks: ${recent.length}`,
    `- Total training volume: ${formatDisplayWeight(totalVolume, weightUnit)}`,
    `- Average session volume: ${formatDisplayWeight(avgVolume, weightUnit)}`,
    `- Weekly training frequency: ${weeklyFrequency} sessions/week`,
    '',
    'Muscle Group Frequency:',
    ...(muscleFrequencyLines.length > 0 ? muscleFrequencyLines : ['- Not enough muscle-group data available.']),
    '',
    'Strength Progression:',
    ...(strengthProgressionLines.length > 0 ? strengthProgressionLines : ['- Not enough completed strength data available.']),
    '',
    'Recent Workouts (last 10, most recent first):',
    ...recentSessionLines,
  ].join('\n');

  return {
    userGoal: user.goal,
    userExperience: user.experienceLevel,
    workoutSummary: summary,
  };
}
