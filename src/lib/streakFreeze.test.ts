import { describe, expect, it } from 'vitest';
import {
  availableFreezeCount,
  calculateStreakWithFreeze,
  createStreakFreeze,
  MAX_FREEZE_BALANCE,
} from './streakFreeze';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('createStreakFreeze', () => {
  it('creates an unconsumed freeze', () => {
    const f = createStreakFreeze('user-1');
    expect(f.consumedDate).toBeNull();
    expect(f.userId).toBe('user-1');
  });
});

describe('availableFreezeCount', () => {
  it('counts only unconsumed freezes', () => {
    const freezes = [
      createStreakFreeze('u1'),
      { ...createStreakFreeze('u1'), consumedDate: '2025-01-01' },
    ];
    expect(availableFreezeCount(freezes)).toBe(1);
  });
});

describe('calculateStreakWithFreeze', () => {
  it('returns 0 with no sessions', () => {
    const { streak } = calculateStreakWithFreeze([], []);
    expect(streak).toBe(0);
  });

  it('counts consecutive sessions', () => {
    const sessions = [daysAgo(2), daysAgo(1), daysAgo(0)];
    const { streak } = calculateStreakWithFreeze(sessions, []);
    expect(streak).toBeGreaterThanOrEqual(3);
  });

  it('consumes a freeze to bridge a single missed day', () => {
    // Sessions: 3 days ago and 1 day ago — missing 2 days ago
    const sessions = [daysAgo(3), daysAgo(1)];
    const freeze = createStreakFreeze('u1');
    const { streak, freezeConsumed } = calculateStreakWithFreeze(sessions, [freeze]);
    expect(streak).toBeGreaterThanOrEqual(2);
    expect(freezeConsumed).toBe(true);
  });

  it('breaks streak without a freeze', () => {
    // Sessions: 5 days ago and 1 day ago — missing 4, 3, 2 days ago
    const sessions = [daysAgo(5), daysAgo(1)];
    const { streak } = calculateStreakWithFreeze(sessions, []);
    // Streak should only count the unbroken tail (today's preceding session = 1)
    expect(streak).toBeLessThanOrEqual(2);
  });
});

describe('MAX_FREEZE_BALANCE', () => {
  it('is a positive number', () => {
    expect(MAX_FREEZE_BALANCE).toBeGreaterThan(0);
  });
});
