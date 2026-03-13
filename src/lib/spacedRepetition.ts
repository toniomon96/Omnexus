/**
 * Spaced Repetition Scheduler (SM-2 variant)
 *
 * Based on the SuperMemo SM-2 algorithm:
 *   https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-achieved-in-working-with-the-supermemo-method
 *
 * Quality scale (0–5):
 *   5 = perfect recall with no hesitation
 *   4 = correct with slight hesitation
 *   3 = correct with serious difficulty
 *   2 = incorrect, but the answer seemed easy on seeing it
 *   1 = incorrect, remembered on seeing the answer
 *   0 = total blackout
 *
 * Intervals:
 *   repetitions = 0 → 1 day
 *   repetitions = 1 → 6 days
 *   repetitions ≥ 2 → previous interval × EF
 *
 * EF (easiness factor) is bounded [1.3, 2.5].
 */

import type { SpacedRepCard, SpacedRepQuality } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_EF = 1.3;
const MAX_EF = 2.5;
const DEFAULT_EF = 2.5;

// ─── Core algorithm ───────────────────────────────────────────────────────────

/**
 * Update a SpacedRepCard after a review.
 * Returns a new card object (does not mutate the input).
 */
export function reviewCard(card: SpacedRepCard, quality: SpacedRepQuality, now = new Date()): SpacedRepCard {
  // Update easiness factor
  const newEF = Math.max(
    MIN_EF,
    Math.min(
      MAX_EF,
      card.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    ),
  );

  let newRepetitions: number;
  let newIntervalDays: number;

  if (quality < 3) {
    // Incorrect response — reset repetitions, restart from 1 day
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    // Correct response — advance
    newRepetitions = card.repetitions + 1;
    if (newRepetitions === 1) {
      newIntervalDays = 1;
    } else if (newRepetitions === 2) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(card.intervalDays * newEF);
    }
  }

  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + newIntervalDays);

  return {
    ...card,
    easinessFactor: newEF,
    intervalDays: newIntervalDays,
    repetitions: newRepetitions,
    nextDueAt: nextDue.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

// ─── Card factory ─────────────────────────────────────────────────────────────

export function createCard(userId: string, cardId: string, now = new Date()): SpacedRepCard {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    cardId,
    userId,
    easinessFactor: DEFAULT_EF,
    intervalDays: 1,
    repetitions: 0,
    nextDueAt: tomorrow.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

/** Return cards that are due on or before `asOf` (default: now). */
export function getDueCards(cards: SpacedRepCard[], asOf = new Date()): SpacedRepCard[] {
  return cards.filter((c) => new Date(c.nextDueAt) <= asOf);
}

/**
 * Sort a set of due cards by priority:
 *   1. Overdue cards first (oldest due date)
 *   2. Then by lowest EF (hardest cards reviewed sooner)
 */
export function sortDueCards(dueCards: SpacedRepCard[]): SpacedRepCard[] {
  return [...dueCards].sort((a, b) => {
    const dateDiff = new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.easinessFactor - b.easinessFactor;
  });
}

/** True when a card is considered "mature" (interval ≥ 21 days). */
export function isMature(card: SpacedRepCard): boolean {
  return card.intervalDays >= 21;
}

/** Human-readable next-due label (e.g. "due in 3 days" or "due today"). */
export function nextDueLabel(card: SpacedRepCard, now = new Date()): string {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((new Date(card.nextDueAt).getTime() - now.getTime()) / msPerDay);
  if (diffDays <= 0) return 'due today';
  if (diffDays === 1) return 'due tomorrow';
  return `due in ${diffDays} days`;
}
