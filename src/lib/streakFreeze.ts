/**
 * Streak Freeze
 *
 * Streak freezes prevent a streak from being broken when a user misses a day.
 * They are consumed automatically on the first missed day after being awarded.
 *
 * Design notes (aligned with Duolingo's approach):
 *   - A freeze is a "one-day buffer" — it does not extend the streak, it simply
 *     prevents it from resetting on a single rest day.
 *   - A freeze is consumed silently; the UI shows an ice-crystal indicator.
 *   - Users can hold at most MAX_FREEZE_BALANCE freezes at once.
 */

import type { StreakFreeze } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const MAX_FREEZE_BALANCE = 3;

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createStreakFreeze(userId: string, now = new Date()): StreakFreeze {
  return {
    id: uuidv4(),
    userId,
    consumedDate: null,
    awardedAt: now.toISOString(),
  };
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

/** Count how many freezes the user has available (unconsumed). */
export function availableFreezeCount(freezes: StreakFreeze[]): number {
  return freezes.filter((f) => f.consumedDate === null).length;
}

// ─── Streak calculation with freeze support ───────────────────────────────────

interface StreakResult {
  streak: number;
  /** True if a freeze was consumed during this calculation. */
  freezeConsumed: boolean;
  /** The freeze that was consumed (if any). */
  consumedFreeze?: StreakFreeze;
}

/**
 * Re-calculate the streak for a user.
 *
 * @param sessionDates - ISO date strings (any time) for each completed session
 * @param freezes      - Current freeze inventory
 * @param today        - Override for "today" (useful in tests)
 */
export function calculateStreakWithFreeze(
  sessionDates: string[],
  freezes: StreakFreeze[],
  today = new Date(),
): StreakResult {
  if (sessionDates.length === 0) {
    return { streak: 0, freezeConsumed: false };
  }

  // Normalise to YYYY-MM-DD strings
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const trainedSet = new Set(
    sessionDates.map((iso) => toDateStr(new Date(iso))),
  );

  const availableFreezes = freezes.filter((f) => f.consumedDate === null);

  const todayStr = toDateStr(today);

  // Walk backwards from today counting consecutive active days
  let streak = 0;
  let freezeConsumed = false;
  let consumedFreeze: StreakFreeze | undefined;
  // freezeUsedThisPass prevents consuming more than one freeze for a single
  // contiguous gap (consecutive missed days). It resets when a trained day is
  // encountered so that separate isolated gaps each consume their own freeze.
  let freezeUsedThisPass = false;

  for (let offset = 0; offset <= 365; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const dateStr = toDateStr(d);

    if (trainedSet.has(dateStr)) {
      streak++;
      freezeUsedThisPass = false; // reset: next gap may use another freeze
      continue;
    }

    // Today is allowed to be a rest day without breaking the streak
    if (dateStr === todayStr) {
      continue;
    }

    // Gap: try to consume a freeze
    if (!freezeUsedThisPass && availableFreezes.length > 0) {
      const freeze = availableFreezes.shift()!;
      freeze.consumedDate = dateStr;
      freezeConsumed = true;
      consumedFreeze = freeze;
      freezeUsedThisPass = true;
      // Don't increment streak for a frozen day, just bridge the gap
      continue;
    }

    // Streak broken
    break;
  }

  return { streak, freezeConsumed, consumedFreeze };
}
