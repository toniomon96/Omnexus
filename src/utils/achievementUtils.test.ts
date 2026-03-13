import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateAchievements, loadEarnedAchievements } from './achievementUtils';
import type { AchievementCheckContext } from './achievementUtils';

// ─── localStorage mock (node environment has no DOM) ─────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((_i: number) => null),
};
vi.stubGlobal('localStorage', localStorageMock);

// ─────────────────────────────────────────────────────────────────────────────

const emptyCtx = (): AchievementCheckContext => ({
  sessions: [],
  nutritionLogs: [],
  completedLessonIds: [],
  completedCourseIds: [],
  perfectQuizIds: [],
  hasActiveProgramId: false,
  hasAiProgram: false,
  currentStreak: 0,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('evaluateAchievements', () => {
  it('returns no achievements for empty context', () => {
    const result = evaluateAchievements(emptyCtx());
    expect(result).toEqual([]);
  });

  it('awards first-workout when 1 session exists', () => {
    const ctx = emptyCtx();
    ctx.sessions = [
      { id: 's1', exercises: [], startedAt: '2026-01-01', completedAt: '2026-01-01', durationSeconds: 0, syncStatus: 'saved_on_device' } as any,
    ];
    const result = evaluateAchievements(ctx);
    expect(result).toContain('first-workout');
  });

  it('does not re-award already-earned achievements', () => {
    const ctx = emptyCtx();
    ctx.sessions = [
      { id: 's1', exercises: [], startedAt: '2026-01-01', completedAt: '2026-01-01', durationSeconds: 0, syncStatus: 'saved_on_device' } as any,
    ];
    evaluateAchievements(ctx); // first call earns first-workout
    const result2 = evaluateAchievements(ctx); // second call should not
    expect(result2).not.toContain('first-workout');
  });

  it('awards streak-3 when streak is 3', () => {
    const ctx = emptyCtx();
    ctx.currentStreak = 3;
    const result = evaluateAchievements(ctx);
    expect(result).toContain('streak-3');
    expect(result).not.toContain('streak-7');
  });

  it('awards first-lesson for learning progress', () => {
    const ctx = emptyCtx();
    ctx.completedLessonIds = ['lesson-1'];
    const result = evaluateAchievements(ctx);
    expect(result).toContain('first-lesson');
  });

  it('persists earned achievements to localStorage', () => {
    const ctx = emptyCtx();
    ctx.completedLessonIds = ['lesson-1'];
    evaluateAchievements(ctx);
    const persisted = loadEarnedAchievements();
    expect(persisted.some(e => e.id === 'first-lesson')).toBe(true);
  });
});
