import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
});
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

// Mock courses to have a known, deterministic pool
vi.mock('../data/courses', () => ({
  courses: [
    {
      id: 'course-a',
      title: 'Course A',
      modules: [
        {
          id: 'mod-a1',
          lessons: [
            { id: 'lesson-a1-1', title: 'Lesson 1' },
            { id: 'lesson-a1-2', title: 'Lesson 2' },
          ],
        },
      ],
    },
    {
      id: 'course-b',
      title: 'Course B',
      modules: [
        {
          id: 'mod-b1',
          lessons: [
            { id: 'lesson-b1-1', title: 'Lesson 3' },
          ],
        },
      ],
    },
  ],
}));

import { getTodaysDailyChallenge } from './dailyChallenge';

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getTodaysDailyChallenge', () => {
  it('returns a challenge object for today', () => {
    const challenge = getTodaysDailyChallenge();
    expect(challenge).not.toBeNull();
    expect(challenge?.lessonId).toBeTruthy();
    expect(challenge?.courseId).toBeTruthy();
    expect(challenge?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns completed=false on first call', () => {
    const challenge = getTodaysDailyChallenge();
    expect(challenge?.completed).toBe(false);
  });

  it('returns the same challenge on consecutive calls (cached)', () => {
    const first = getTodaysDailyChallenge();
    const second = getTodaysDailyChallenge();
    expect(first?.lessonId).toBe(second?.lessonId);
    expect(first?.date).toBe(second?.date);
  });

  it('persists the challenge to localStorage', () => {
    getTodaysDailyChallenge();
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('is deterministic for the same date string', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));

    for (const k of Object.keys(store)) delete store[k]; // clear cache
    const first = getTodaysDailyChallenge();

    for (const k of Object.keys(store)) delete store[k]; // clear cache again
    const second = getTodaysDailyChallenge();

    expect(first?.lessonId).toBe(second?.lessonId);
  });

  it('produces different challenges on different dates', () => {
    // Collect challenges across 30 distinct dates and check we get more than 1 unique
    const seen = new Set<string>();
    for (let day = 1; day <= 30; day++) {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`2025-03-${String(day).padStart(2, '0')}T10:00:00Z`));
      for (const k of Object.keys(store)) delete store[k];
      const c = getTodaysDailyChallenge();
      if (c) seen.add(c.lessonId);
      vi.useRealTimers();
    }
    // With 3 lessons across 30 days we expect > 1 unique (not all days pick same lesson)
    expect(seen.size).toBeGreaterThan(1);
  });

  it('reloads challenge from cache when date matches', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-20T10:00:00Z'));
    for (const k of Object.keys(store)) delete store[k];

    const first = getTodaysDailyChallenge();
    // setItem called once for first retrieval
    const setCallCount = vi.mocked(localStorage.setItem).mock.calls.length;

    // Second call should use the cache, not setItem again
    getTodaysDailyChallenge();
    expect(vi.mocked(localStorage.setItem).mock.calls.length).toBe(setCallCount);

    expect(first).not.toBeNull();
  });
});
