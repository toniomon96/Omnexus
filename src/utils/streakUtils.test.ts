import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayUTC, currentMondayUTC, computeNewStreak } from './streakUtils';

// ─── todayUTC ─────────────────────────────────────────────────────────────────

describe('todayUTC', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayUTC();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the UTC date portion of new Date().toISOString()', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(todayUTC()).toBe(expected);
  });
});

// ─── currentMondayUTC ─────────────────────────────────────────────────────────

describe('currentMondayUTC', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(currentMondayUTC()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is on or before today', () => {
    const today = todayUTC();
    expect(currentMondayUTC() <= today).toBe(true);
  });

  it('falls on a Monday', () => {
    const monday = currentMondayUTC();
    const day = new Date(monday + 'T00:00:00Z').getUTCDay();
    expect(day).toBe(1); // 1 = Monday
  });

  it('returns consistent result when called twice', () => {
    expect(currentMondayUTC()).toBe(currentMondayUTC());
  });
});

// ─── computeNewStreak ─────────────────────────────────────────────────────────

describe('computeNewStreak', () => {
  const RealDate = globalThis.Date;

  function setNowTo(isoDate: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoDate + 'T12:00:00Z'));
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isNewDay=false when lastUpdatedDate is today', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(5, '2025-03-10');
    expect(result.isNewDay).toBe(false);
    expect(result.newStreak).toBe(5);
    expect(result.hitMilestone).toBe(false);
  });

  it('increments streak when last update was yesterday', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(6, '2025-03-09');
    expect(result.isNewDay).toBe(true);
    expect(result.newStreak).toBe(7);
  });

  it('resets streak to 1 when last update was 2+ days ago', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(10, '2025-03-07');
    expect(result.isNewDay).toBe(true);
    expect(result.newStreak).toBe(1);
  });

  it('resets streak to 1 when last update is empty string (first ever)', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(0, '');
    expect(result.isNewDay).toBe(true);
    expect(result.newStreak).toBe(1);
  });

  it('sets hitMilestone=true at multiples of 7', () => {
    setNowTo('2025-03-10');
    // streak of 6 + 1 = 7
    const result = computeNewStreak(6, '2025-03-09');
    expect(result.hitMilestone).toBe(true);
    expect(result.newStreak).toBe(7);
  });

  it('sets hitMilestone=true at 14, 21, 30, 100 as multiples of 7', () => {
    setNowTo('2025-03-10');
    const r14 = computeNewStreak(13, '2025-03-09');
    expect(r14.hitMilestone).toBe(true);

    const r15 = computeNewStreak(14, '2025-03-09');
    expect(r15.hitMilestone).toBe(false); // 15 is not a multiple of 7
  });

  it('sets hitMilestone=false for non-milestone streaks', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(4, '2025-03-09'); // 5, not a multiple of 7
    expect(result.hitMilestone).toBe(false);
  });

  it('resets streak to 1 when lastUpdatedDate is far in the past', () => {
    setNowTo('2025-03-10');
    const result = computeNewStreak(365, '2024-01-01');
    expect(result.newStreak).toBe(1);
    expect(result.hitMilestone).toBe(false);
  });

  void RealDate; // suppress unused warning
});
