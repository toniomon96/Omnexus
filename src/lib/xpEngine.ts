/**
 * XP Engine
 *
 * Computes XP awards for user actions.  All award amounts are defined here
 * (server-side in a real deployment) so there is a single source of truth that
 * prevents client-side spoofing.
 *
 * Level thresholds follow a quadratic curve:
 *   xp_for_level(n) = 100 * n^2
 * e.g. Level 1 → 100 XP, Level 2 → 400 XP, Level 3 → 900 XP …
 */

import type { XpEvent, XpEventType, XpProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─── XP Award table ───────────────────────────────────────────────────────────

const XP_AMOUNTS: Record<XpEventType, number> = {
  workout_completed: 50,
  pr_achieved: 100,
  streak_milestone: 75,
  lesson_completed: 30,
  quiz_passed: 60,
  challenge_joined: 10,
  challenge_completed: 150,
  friend_reaction_sent: 5,
  daily_checkin: 10,
};

const XP_LABELS: Record<XpEventType, string> = {
  workout_completed: 'Workout completed',
  pr_achieved: 'Personal record!',
  streak_milestone: 'Streak milestone',
  lesson_completed: 'Lesson completed',
  quiz_passed: 'Quiz passed',
  challenge_joined: 'Joined a challenge',
  challenge_completed: 'Challenge completed',
  friend_reaction_sent: 'Reaction sent',
  daily_checkin: 'Daily check-in',
};

// ─── Level maths ─────────────────────────────────────────────────────────────

const RANK_LABELS: string[] = [
  'Rookie',      // level 1
  'Rookie',      // level 2
  'Athlete',     // level 3
  'Athlete',     // level 4
  'Contender',   // level 5
  'Contender',   // level 6
  'Competitor',  // level 7
  'Competitor',  // level 8
  'Elite',       // level 9
  'Elite',       // level 10+
];

/** Total XP required to reach a given level (1-based; level must be ≥ 1). */
function xpForLevel(level: number): number {
  return 100 * level * level;
}

/** Derive the current level from total XP. Always returns ≥ 1. */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function buildXpProfile(userId: string, totalXp: number): XpProfile {
  const level = levelFromXp(totalXp);
  const currentLevelStart = xpForLevel(level);
  const nextLevelStart = xpForLevel(level + 1);
  const rankLabel = RANK_LABELS[Math.min(level - 1, RANK_LABELS.length - 1)];

  return {
    userId,
    totalXp,
    level,
    xpInCurrentLevel: totalXp - currentLevelStart,
    xpToNextLevel: nextLevelStart - currentLevelStart,
    rankLabel,
  };
}

// ─── Event creation ───────────────────────────────────────────────────────────

export interface CreateXpEventOptions {
  userId: string;
  type: XpEventType;
  referenceId?: string;
  /** Override the default XP amount (e.g. for bonus multipliers). */
  amountOverride?: number;
}

export function createXpEvent(opts: CreateXpEventOptions): XpEvent {
  const amount = opts.amountOverride ?? XP_AMOUNTS[opts.type];
  return {
    id: uuidv4(),
    userId: opts.userId,
    type: opts.type,
    amount,
    label: XP_LABELS[opts.type],
    referenceId: opts.referenceId,
    occurredAt: new Date().toISOString(),
  };
}

/** Return the canonical XP amount for a given event type. */
export function xpAmountFor(type: XpEventType): number {
  return XP_AMOUNTS[type];
}

/** Accumulate a list of XP events into a running total. */
export function sumXp(events: Pick<XpEvent, 'amount'>[]): number {
  return events.reduce((acc, e) => acc + e.amount, 0);
}
