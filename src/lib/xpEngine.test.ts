import { describe, expect, it } from 'vitest';
import { buildXpProfile, createXpEvent, levelFromXp, sumXp, xpAmountFor } from './xpEngine';

describe('levelFromXp', () => {
  it('returns level 1 at 0 XP', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it('returns level 1 just before the 400 XP threshold', () => {
    expect(levelFromXp(399)).toBe(1);
  });

  it('returns level 2 at exactly 400 XP', () => {
    expect(levelFromXp(400)).toBe(2);
  });

  it('returns level 3 at exactly 900 XP', () => {
    expect(levelFromXp(900)).toBe(3);
  });
});

describe('buildXpProfile', () => {
  it('computes xpInCurrentLevel correctly at level 2', () => {
    // level 2 starts at 400, next level (3) starts at 900
    const profile = buildXpProfile('user-1', 550);
    expect(profile.level).toBe(2);
    expect(profile.xpInCurrentLevel).toBe(150); // 550 - 400
    expect(profile.xpToNextLevel).toBe(500);    // 900 - 400
  });

  it('assigns a rank label', () => {
    const profile = buildXpProfile('user-1', 0);
    expect(profile.rankLabel).toBeTruthy();
  });
});

describe('createXpEvent', () => {
  it('uses the canonical amount for the event type', () => {
    const event = createXpEvent({ userId: 'u1', type: 'workout_completed' });
    expect(event.amount).toBe(xpAmountFor('workout_completed'));
    expect(event.type).toBe('workout_completed');
    expect(event.userId).toBe('u1');
  });

  it('respects an amountOverride', () => {
    const event = createXpEvent({ userId: 'u1', type: 'pr_achieved', amountOverride: 200 });
    expect(event.amount).toBe(200);
  });
});

describe('sumXp', () => {
  it('sums event amounts', () => {
    const events = [{ amount: 50 }, { amount: 100 }, { amount: 30 }];
    expect(sumXp(events)).toBe(180);
  });

  it('returns 0 for empty array', () => {
    expect(sumXp([])).toBe(0);
  });
});
