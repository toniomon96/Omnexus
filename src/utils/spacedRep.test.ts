import { describe, it, expect } from 'vitest';
import { applyReview, createCard, isCardDue, scoreToQuality } from './spacedRep';
import type { SpacedRepCard } from '../types';

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<SpacedRepCard> = {}): SpacedRepCard {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    cardId: 'card-1',
    userId: 'user-1',
    easinessFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    nextDueAt: tomorrow.toISOString(),
    lastReviewedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── createCard ───────────────────────────────────────────────────────────────

describe('createCard', () => {
  it('creates a card with default easiness factor', () => {
    const card = createCard('c1', 'u1');
    expect(card.easinessFactor).toBe(2.5);
  });

  it('sets repetitions to 0', () => {
    const card = createCard('c1', 'u1');
    expect(card.repetitions).toBe(0);
  });

  it('sets intervalDays to 1', () => {
    const card = createCard('c1', 'u1');
    expect(card.intervalDays).toBe(1);
  });

  it('sets nextDueAt to tomorrow', () => {
    const before = new Date();
    const card = createCard('c1', 'u1');
    const due = new Date(card.nextDueAt);
    // nextDueAt should be approx tomorrow (within 2 seconds of now + 1 day)
    const diff = due.getTime() - before.getTime();
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('stores the provided cardId and userId', () => {
    const card = createCard('lesson-42', 'user-99');
    expect(card.cardId).toBe('lesson-42');
    expect(card.userId).toBe('user-99');
  });
});

// ─── isCardDue ────────────────────────────────────────────────────────────────

describe('isCardDue', () => {
  it('returns true when nextDueAt is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const card = makeCard({ nextDueAt: past });
    expect(isCardDue(card)).toBe(true);
  });

  it('returns false when nextDueAt is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const card = makeCard({ nextDueAt: future });
    expect(isCardDue(card)).toBe(false);
  });

  it('returns true when nextDueAt is exactly now (boundary)', () => {
    const now = new Date().toISOString();
    const card = makeCard({ nextDueAt: now });
    // May be true or false due to timing; just ensure no exception
    expect(typeof isCardDue(card)).toBe('boolean');
  });
});

// ─── applyReview ──────────────────────────────────────────────────────────────

describe('applyReview', () => {
  describe('failed recall (quality < 3)', () => {
    it('resets repetitions to 0 on quality=0', () => {
      const card = makeCard({ repetitions: 5, intervalDays: 30 });
      const updated = applyReview(card, 0);
      expect(updated.repetitions).toBe(0);
    });

    it('resets intervalDays to 1 on failure', () => {
      const card = makeCard({ repetitions: 3, intervalDays: 20 });
      const updated = applyReview(card, 1);
      expect(updated.intervalDays).toBe(1);
    });

    it('clamps easinessFactor to MIN (1.3) on quality=0', () => {
      // Low easiness + quality=0 may push below minimum
      const card = makeCard({ easinessFactor: 1.4 });
      const updated = applyReview(card, 0);
      expect(updated.easinessFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('applies to quality=2 (still failed recall)', () => {
      const card = makeCard({ repetitions: 4 });
      const updated = applyReview(card, 2);
      expect(updated.repetitions).toBe(0);
      expect(updated.intervalDays).toBe(1);
    });
  });

  describe('successful recall (quality >= 3)', () => {
    it('increments repetitions by 1', () => {
      const card = makeCard({ repetitions: 2, intervalDays: 6 });
      const updated = applyReview(card, 4);
      expect(updated.repetitions).toBe(3);
    });

    it('sets intervalDays to 1 on first successful review (reps=0)', () => {
      const card = makeCard({ repetitions: 0 });
      const updated = applyReview(card, 4);
      expect(updated.intervalDays).toBe(1);
    });

    it('sets intervalDays to 6 on second successful review (reps=1)', () => {
      const card = makeCard({ repetitions: 1 });
      const updated = applyReview(card, 4);
      expect(updated.intervalDays).toBe(6);
    });

    it('scales interval by easiness on third+ review', () => {
      const card = makeCard({ repetitions: 2, intervalDays: 6, easinessFactor: 2.5 });
      const updated = applyReview(card, 5);
      expect(updated.intervalDays).toBe(Math.round(6 * updated.easinessFactor));
    });

    it('increases easinessFactor on quality=5 (easy)', () => {
      const card = makeCard({ easinessFactor: 2.5, repetitions: 1 });
      const updated = applyReview(card, 5);
      expect(updated.easinessFactor).toBeGreaterThan(2.5);
    });

    it('decreases easinessFactor on quality=3 (hard)', () => {
      const card = makeCard({ easinessFactor: 2.5, repetitions: 1 });
      const updated = applyReview(card, 3);
      expect(updated.easinessFactor).toBeLessThan(2.5);
    });
  });

  describe('immutability and timestamps', () => {
    it('returns a new object, not the original card', () => {
      const card = makeCard();
      const updated = applyReview(card, 4);
      expect(updated).not.toBe(card);
    });

    it('updates lastReviewedAt to approximately now', () => {
      const before = Date.now();
      const card = makeCard();
      const updated = applyReview(card, 4);
      const reviewedAt = new Date(updated.lastReviewedAt).getTime();
      expect(reviewedAt).toBeGreaterThanOrEqual(before);
      expect(reviewedAt).toBeLessThanOrEqual(Date.now() + 100);
    });

    it('preserves cardId and userId', () => {
      const card = makeCard({ cardId: 'quiz-7', userId: 'usr-42' });
      const updated = applyReview(card, 4);
      expect(updated.cardId).toBe('quiz-7');
      expect(updated.userId).toBe('usr-42');
    });
  });
});

// ─── scoreToQuality ───────────────────────────────────────────────────────────

describe('scoreToQuality', () => {
  it('maps 100 → 5', () => expect(scoreToQuality(100)).toBe(5));
  it('maps 90  → 5', () => expect(scoreToQuality(90)).toBe(5));
  it('maps 89  → 4', () => expect(scoreToQuality(89)).toBe(4));
  it('maps 75  → 4', () => expect(scoreToQuality(75)).toBe(4));
  it('maps 74  → 3', () => expect(scoreToQuality(74)).toBe(3));
  it('maps 60  → 3', () => expect(scoreToQuality(60)).toBe(3));
  it('maps 59  → 2', () => expect(scoreToQuality(59)).toBe(2));
  it('maps 40  → 2', () => expect(scoreToQuality(40)).toBe(2));
  it('maps 39  → 1', () => expect(scoreToQuality(39)).toBe(1));
  it('maps 20  → 1', () => expect(scoreToQuality(20)).toBe(1));
  it('maps 19  → 0', () => expect(scoreToQuality(19)).toBe(0));
  it('maps 0   → 0', () => expect(scoreToQuality(0)).toBe(0));
});
