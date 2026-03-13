/**
 * Streak & date utilities shared between hooks and the AppContext reducer.
 * All date comparisons use YYYY-MM-DD UTC strings to avoid timezone issues.
 */

/** Today's date as YYYY-MM-DD in UTC. */
export function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

/** The most recent Monday's date as YYYY-MM-DD in UTC. */
export function currentMondayUTC(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const daysFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  return d.toISOString().split('T')[0];
}

export interface StreakUpdateResult {
  newStreak: number;
  /** False when the streak was already updated today (no-op). */
  isNewDay: boolean;
  /** True when the new streak value is a multiple of 7. */
  hitMilestone: boolean;
}

/**
 * Compute the updated streak value.
 *
 * Rules:
 * - Same day as today  → no change (already incremented)
 * - Previous day       → increment by 1
 * - Gap > 1 day        → reset to 1
 */
export function computeNewStreak(
  currentStreak: number,
  lastUpdatedDate: string,
): StreakUpdateResult {
  const today = todayUTC();

  if (lastUpdatedDate === today) {
    return { newStreak: currentStreak, isNewDay: false, hitMilestone: false };
  }

  const prevDay = new Date();
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const yesterday = prevDay.toISOString().split('T')[0];

  const newStreak = lastUpdatedDate === yesterday ? currentStreak + 1 : 1;
  return {
    newStreak,
    isNewDay: true,
    hitMilestone: newStreak % 7 === 0,
  };
}
