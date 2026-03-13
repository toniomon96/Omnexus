import { describe, expect, it } from 'vitest';
import {
  createCard,
  getDueCards,
  isMature,
  nextDueLabel,
  reviewCard,
  sortDueCards,
} from './spacedRepetition';
import type { SpacedRepCard } from '../types';

function makeCard(overrides: Partial<SpacedRepCard> = {}): SpacedRepCard {
  return {
    cardId: 'q1',
    userId: 'user-1',
    easinessFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    nextDueAt: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('createCard', () => {
  it('creates a card with default EF 2.5 and 1-day interval', () => {
    const card = createCard('user-1', 'q1');
    expect(card.easinessFactor).toBe(2.5);
    expect(card.intervalDays).toBe(1);
    expect(card.repetitions).toBe(0);
  });
});

describe('reviewCard', () => {
  it('resets repetitions on quality < 3', () => {
    const card = makeCard({ repetitions: 3, intervalDays: 15 });
    const updated = reviewCard(card, 1);
    expect(updated.repetitions).toBe(0);
    expect(updated.intervalDays).toBe(1);
  });

  it('advances interval on quality ≥ 3', () => {
    const card = makeCard({ repetitions: 0 });
    const after1 = reviewCard(card, 4);
    expect(after1.repetitions).toBe(1);
    expect(after1.intervalDays).toBe(1);

    const after2 = reviewCard(after1, 4);
    expect(after2.repetitions).toBe(2);
    expect(after2.intervalDays).toBe(6);

    const after3 = reviewCard(after2, 5);
    expect(after3.intervalDays).toBeGreaterThan(6);
  });

  it('decreases EF for quality 3', () => {
    const card = makeCard({ easinessFactor: 2.5 });
    const updated = reviewCard(card, 3);
    expect(updated.easinessFactor).toBeLessThan(2.5);
  });

  it('does not drop EF below 1.3', () => {
    let card = makeCard({ easinessFactor: 1.31 });
    for (let i = 0; i < 10; i++) {
      card = reviewCard(card, 0);
    }
    expect(card.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('getDueCards', () => {
  it('returns only cards whose nextDueAt is in the past or now', () => {
    const past = makeCard({ nextDueAt: new Date(Date.now() - 10000).toISOString() });
    const future = makeCard({ nextDueAt: new Date(Date.now() + 10000).toISOString() });
    expect(getDueCards([past, future])).toHaveLength(1);
  });
});

describe('sortDueCards', () => {
  it('puts oldest-due cards first', () => {
    const older = makeCard({ nextDueAt: new Date(Date.now() - 20000).toISOString() });
    const newer = makeCard({ nextDueAt: new Date(Date.now() - 5000).toISOString() });
    const sorted = sortDueCards([newer, older]);
    expect(sorted[0]).toStrictEqual(older);
  });
});

describe('isMature', () => {
  it('returns true for intervals >= 21 days', () => {
    expect(isMature(makeCard({ intervalDays: 21 }))).toBe(true);
    expect(isMature(makeCard({ intervalDays: 20 }))).toBe(false);
  });
});

describe('nextDueLabel', () => {
  it('returns "due today" when the card is overdue', () => {
    const card = makeCard({ nextDueAt: new Date(Date.now() - 10000).toISOString() });
    expect(nextDueLabel(card)).toBe('due today');
  });

  it('returns "due tomorrow" for +1 day', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const card = makeCard({ nextDueAt: tomorrow.toISOString() });
    expect(nextDueLabel(card)).toBe('due tomorrow');
  });
});
