import type { AiChallenge } from '../types';
import type { WorkoutSession } from '../types';

/**
 * Given a list of workout sessions and a personal challenge, return the current
 * metric value (not percentage) toward the challenge target.
 *
 * Only sessions that fall within the challenge's start/end window are counted.
 */
export function computeChallengeProgress(
  challenge: Pick<AiChallenge, 'metric' | 'startDate' | 'endDate'>,
  sessions: WorkoutSession[],
): number {
  const startMs = new Date(challenge.startDate).getTime();
  // Include the full end day by adding one day minus one millisecond.
  const endMs = new Date(challenge.endDate).getTime() + 86_400_000 - 1;

  const windowSessions = sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= startMs && t <= endMs;
  });

  switch (challenge.metric) {
    case 'sessions_count':
      return windowSessions.length;

    case 'total_volume': {
      let totalKg = 0;
      for (const s of windowSessions) {
        for (const ex of s.exercises) {
          for (const set of ex.sets) {
            if (set.completed) {
              totalKg += (set.weight ?? 0) * (set.reps ?? 0);
            }
          }
        }
      }
      return Math.round(totalKg * 10) / 10;
    }

    case 'consistency':
      // Count unique training days in the window.
      return new Set(
        windowSessions.map((s) => new Date(s.startedAt).toISOString().split('T')[0]),
      ).size;

    case 'pr_count': {
      // Build baseline PRs from sessions completed BEFORE the challenge window only,
      // so we don't penalise in-window PRs against future out-of-window data.
      const priorSessions = sessions.filter((s) => new Date(s.startedAt).getTime() < startMs);
      const prMap: Record<string, number> = {};
      for (const s of priorSessions) {
        for (const ex of s.exercises) {
          for (const set of ex.sets) {
            if (set.completed && set.weight > 0) {
              const key = ex.exerciseId;
              if (!prMap[key] || set.weight > prMap[key]) {
                prMap[key] = set.weight;
              }
            }
          }
        }
      }
      // Sort window sessions chronologically so the baseline updates correctly.
      const windowSorted = [...windowSessions].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      );
      let count = 0;
      for (const s of windowSorted) {
        let sessionHasPr = false;
        for (const ex of s.exercises) {
          for (const set of ex.sets) {
            if (set.completed && set.weight > 0) {
              const key = ex.exerciseId;
              const prev = prMap[key];
              if (prev === undefined || set.weight > prev) {
                sessionHasPr = true;
                prMap[key] = set.weight;
              }
            }
          }
        }
        if (sessionHasPr) count++;
      }
      return count;
    }

    default:
      return 0;
  }
}

/**
 * Returns a human-readable description of the challenge metric.
 */
export function metricLabel(metric: AiChallenge['metric']): string {
  switch (metric) {
    case 'sessions_count': return 'workouts completed';
    case 'total_volume': return 'total volume lifted';
    case 'consistency': return 'training days';
    case 'pr_count': return 'personal records set';
    default: return 'progress';
  }
}
