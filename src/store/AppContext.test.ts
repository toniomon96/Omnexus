import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Action } from './AppContext';

// ─── Mock modules that require env vars / network ────────────────────────────
vi.mock('../lib/db', () => ({ upsertLearningProgress: vi.fn() }));
vi.mock('../lib/analytics', () => ({ identify: vi.fn() }));

// ─── Mock localStorage (Node env) ────────────────────────────────────────────

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
});
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

import { reducer } from './AppContext';
import type { AppState } from './AppContext';
import type { User, WorkoutSession, LearningProgress } from '../types';
import { buildXpProfile } from '../lib/xpEngine';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'u1',
  name: 'Test',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  onboardedAt: '2025-01-01T00:00:00Z',
  theme: 'dark',
};

const emptyLP: LearningProgress = {
  completedLessons: [],
  completedModules: [],
  completedCourses: [],
  quizScores: {},
  lastActivityAt: '',
};

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    user: null,
    history: { sessions: [], personalRecords: [] },
    activeSession: null,
    theme: 'light',
    learningProgress: { ...emptyLP },
    xpProfile: null,
    streak: 0,
    sparks: 0,
    unlockedAchievementIds: [],
    pendingCelebrations: [],
    ...overrides,
  };
}

function mockSession(id: string): WorkoutSession {
  return {
    id,
    programId: 'prog',
    trainingDayIndex: 0,
    startedAt: '2025-03-01T10:00:00Z',
    exercises: [],
    totalVolumeKg: 500,
  };
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AppContext reducer', () => {
  // ── User ──

  it('SET_USER sets the user', () => {
    const state = reducer(baseState(), { type: 'SET_USER', payload: mockUser });
    expect(state.user).toEqual(mockUser);
  });

  it('CLEAR_USER resets user, session, and history', () => {
    const state = reducer(
      baseState({ user: mockUser, activeSession: mockSession('a'), history: { sessions: [mockSession('s')], personalRecords: [] } }),
      { type: 'CLEAR_USER' },
    );
    expect(state.user).toBeNull();
    expect(state.activeSession).toBeNull();
    expect(state.history.sessions).toEqual([]);
  });

  // ── Active Session ──

  it('SET_ACTIVE_SESSION sets active session', () => {
    const session = mockSession('a');
    const state = reducer(baseState(), { type: 'SET_ACTIVE_SESSION', payload: session });
    expect(state.activeSession?.id).toBe('a');
  });

  it('UPDATE_ACTIVE_SESSION replaces active session', () => {
    const updated = { ...mockSession('a'), totalVolumeKg: 999 };
    const state = reducer(
      baseState({ activeSession: mockSession('a') }),
      { type: 'UPDATE_ACTIVE_SESSION', payload: updated },
    );
    expect(state.activeSession?.totalVolumeKg).toBe(999);
  });

  it('CLEAR_ACTIVE_SESSION nulls the session', () => {
    const state = reducer(
      baseState({ activeSession: mockSession('a') }),
      { type: 'CLEAR_ACTIVE_SESSION' },
    );
    expect(state.activeSession).toBeNull();
  });

  // ── History ──

  it('APPEND_SESSION adds session to history', () => {
    const session = mockSession('s1');
    const state = reducer(baseState(), { type: 'APPEND_SESSION', payload: session });
    expect(state.history.sessions).toHaveLength(1);
    expect(state.history.sessions[0].id).toBe('s1');
  });

  it('APPEND_SESSION preserves existing sessions', () => {
    const state = reducer(
      baseState({ history: { sessions: [mockSession('s1')], personalRecords: [] } }),
      { type: 'APPEND_SESSION', payload: mockSession('s2') },
    );
    expect(state.history.sessions).toHaveLength(2);
  });

  it('SET_HISTORY replaces entire history', () => {
    const newHistory = { sessions: [mockSession('x')], personalRecords: [] };
    const state = reducer(
      baseState({ history: { sessions: [mockSession('old')], personalRecords: [] } }),
      { type: 'SET_HISTORY', payload: newHistory },
    );
    expect(state.history.sessions).toHaveLength(1);
    expect(state.history.sessions[0].id).toBe('x');
  });

  // ── Theme ──

  it('TOGGLE_THEME toggles dark ↔ light', () => {
    const s1 = reducer(baseState({ theme: 'light' }), { type: 'TOGGLE_THEME' });
    expect(s1.theme).toBe('dark');
    const s2 = reducer(s1, { type: 'TOGGLE_THEME' });
    expect(s2.theme).toBe('light');
  });

  it('SET_THEME sets specific theme', () => {
    const state = reducer(baseState({ theme: 'light' }), { type: 'SET_THEME', payload: 'dark' });
    expect(state.theme).toBe('dark');
  });

  // ── Learning Progress ──

  it('SET_LEARNING_PROGRESS replaces progress', () => {
    const progress: LearningProgress = {
      completedLessons: ['l1'],
      completedModules: [],
      completedCourses: [],
      quizScores: {},
      lastActivityAt: '2025-03-01T00:00:00Z',
    };
    const state = reducer(baseState(), { type: 'SET_LEARNING_PROGRESS', payload: progress });
    expect(state.learningProgress.completedLessons).toEqual(['l1']);
  });

  it('COMPLETE_LESSON adds lesson to completed list', () => {
    const state = reducer(baseState(), { type: 'COMPLETE_LESSON', payload: 'lesson-1' });
    expect(state.learningProgress.completedLessons).toContain('lesson-1');
    expect(state.learningProgress.lastActivityAt).not.toBe('');
  });

  it('COMPLETE_LESSON is idempotent — no duplicate entries', () => {
    const s1 = reducer(baseState(), { type: 'COMPLETE_LESSON', payload: 'lesson-1' });
    const s2 = reducer(s1, { type: 'COMPLETE_LESSON', payload: 'lesson-1' });
    expect(s2.learningProgress.completedLessons.filter((l) => l === 'lesson-1')).toHaveLength(1);
  });

  it('COMPLETE_MODULE adds module', () => {
    const state = reducer(baseState(), { type: 'COMPLETE_MODULE', payload: 'mod-1' });
    expect(state.learningProgress.completedModules).toContain('mod-1');
  });

  it('COMPLETE_COURSE adds course', () => {
    const state = reducer(baseState(), { type: 'COMPLETE_COURSE', payload: 'course-1' });
    expect(state.learningProgress.completedCourses).toContain('course-1');
  });

  it('RECORD_QUIZ_ATTEMPT saves score', () => {
    const state = reducer(baseState(), {
      type: 'RECORD_QUIZ_ATTEMPT',
      payload: { moduleId: 'm1', attempt: { score: 80, correctCount: 8, totalQuestions: 10, attemptedAt: '2025-01-01T00:00:00Z' } },
    });
    expect(state.learningProgress.quizScores['m1']?.score).toBe(80);
  });

  it('RECORD_QUIZ_ATTEMPT only keeps best score', () => {
    const s1 = reducer(baseState(), {
      type: 'RECORD_QUIZ_ATTEMPT',
      payload: { moduleId: 'm1', attempt: { score: 90, correctCount: 9, totalQuestions: 10, attemptedAt: '2025-01-01T00:00:00Z' } },
    });
    const s2 = reducer(s1, {
      type: 'RECORD_QUIZ_ATTEMPT',
      payload: { moduleId: 'm1', attempt: { score: 70, correctCount: 7, totalQuestions: 10, attemptedAt: '2025-01-02T00:00:00Z' } },
    });
    expect(s2.learningProgress.quizScores['m1']?.score).toBe(90); // kept the higher
  });

  it('RECORD_QUIZ_ATTEMPT replaces if new score is higher', () => {
    const s1 = reducer(baseState(), {
      type: 'RECORD_QUIZ_ATTEMPT',
      payload: { moduleId: 'm1', attempt: { score: 70, correctCount: 7, totalQuestions: 10, attemptedAt: '2025-01-01T00:00:00Z' } },
    });
    const s2 = reducer(s1, {
      type: 'RECORD_QUIZ_ATTEMPT',
      payload: { moduleId: 'm1', attempt: { score: 95, correctCount: 9, totalQuestions: 10, attemptedAt: '2025-01-02T00:00:00Z' } },
    });
    expect(s2.learningProgress.quizScores['m1']?.score).toBe(95);
  });

  // ── Unknown action returns state unchanged ──

  it('returns state for unknown action', () => {
    const state = baseState();
    const result = reducer(state, { type: 'NONEXISTENT' } as unknown as Action);
    expect(result).toBe(state);
  });

  // ── AWARD_XP ──

  it('AWARD_XP increases xpProfile.totalXp', () => {
    const state = reducer(baseState({ user: mockUser }), {
      type: 'AWARD_XP',
      payload: { eventType: 'workout_completed' },
    });
    expect(state.xpProfile?.totalXp).toBeGreaterThan(0);
  });

  it('AWARD_XP does nothing when user is null', () => {
    const initial = baseState({ user: null });
    const state = reducer(initial, {
      type: 'AWARD_XP',
      payload: { eventType: 'workout_completed' },
    });
    expect(state.xpProfile).toBeNull();
  });

  it('AWARD_XP respects amountOverride', () => {
    // amountOverride sets the base XP; achievement bonuses may stack on top
    const state = reducer(baseState({ user: mockUser }), {
      type: 'AWARD_XP',
      payload: { eventType: 'workout_completed', amountOverride: 10 },
    });
    expect(state.xpProfile?.totalXp).toBeGreaterThanOrEqual(10);
  });

  it('AWARD_XP queues a rank_up celebration when rank label changes', () => {
    // Start at Rookie level (0 XP). Award 900 XP to reach Athlete (level 3).
    const initial = baseState({
      user: mockUser,
      xpProfile: buildXpProfile('u1', 0), // Rookie
    });
    const state = reducer(initial, {
      type: 'AWARD_XP',
      payload: { eventType: 'workout_completed', amountOverride: 900 },
    });
    const rankUpEvents = state.pendingCelebrations.filter((c) => c.kind === 'rank_up');
    expect(rankUpEvents.length).toBeGreaterThan(0);
    expect(rankUpEvents[0]?.payload).toBe('Athlete');
  });

  it('AWARD_XP does NOT queue rank_up when rank label is unchanged', () => {
    // Small XP that stays within Rookie range
    const state = reducer(baseState({ user: mockUser }), {
      type: 'AWARD_XP',
      payload: { eventType: 'workout_completed', amountOverride: 10 },
    });
    const rankUpEvents = state.pendingCelebrations.filter((c) => c.kind === 'rank_up');
    expect(rankUpEvents).toHaveLength(0);
  });

  // ── SET_STREAK ──

  it('SET_STREAK updates streak value', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 5 });
    expect(state.streak).toBe(5);
  });

  it('SET_STREAK queues streak_milestone at 7 days', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 7 });
    const milestones = state.pendingCelebrations.filter((c) => c.kind === 'streak_milestone');
    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.payload).toBe('7');
  });

  it('SET_STREAK queues streak_milestone at 30 days', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 30 });
    const milestones = state.pendingCelebrations.filter((c) => c.kind === 'streak_milestone');
    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.payload).toBe('30');
  });

  it('SET_STREAK queues streak_milestone at 100 days', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 100 });
    const milestones = state.pendingCelebrations.filter((c) => c.kind === 'streak_milestone');
    expect(milestones).toHaveLength(1);
  });

  it('SET_STREAK queues streak_milestone at 365 days', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 365 });
    const milestones = state.pendingCelebrations.filter((c) => c.kind === 'streak_milestone');
    expect(milestones).toHaveLength(1);
  });

  it('SET_STREAK does NOT queue milestone for non-milestone values', () => {
    const state = reducer(baseState(), { type: 'SET_STREAK', payload: 8 });
    const milestones = state.pendingCelebrations.filter((c) => c.kind === 'streak_milestone');
    expect(milestones).toHaveLength(0);
  });

  // ── QUEUE_CELEBRATION / DEQUEUE_CELEBRATION ──

  it('QUEUE_CELEBRATION appends a celebration to the queue', () => {
    const celebration = {
      id: 'cel-1',
      kind: 'rank_up' as const,
      payload: 'Athlete',
      queuedAt: new Date().toISOString(),
    };
    const state = reducer(baseState(), { type: 'QUEUE_CELEBRATION', payload: celebration });
    expect(state.pendingCelebrations).toHaveLength(1);
    expect(state.pendingCelebrations[0]?.id).toBe('cel-1');
  });

  it('QUEUE_CELEBRATION preserves existing celebrations', () => {
    const cel1 = { id: 'c1', kind: 'rank_up' as const, payload: 'Athlete', queuedAt: '' };
    const cel2 = { id: 'c2', kind: 'streak_milestone' as const, payload: '7', queuedAt: '' };
    const s1 = reducer(baseState(), { type: 'QUEUE_CELEBRATION', payload: cel1 });
    const s2 = reducer(s1, { type: 'QUEUE_CELEBRATION', payload: cel2 });
    expect(s2.pendingCelebrations).toHaveLength(2);
  });

  it('DEQUEUE_CELEBRATION removes only the specified id', () => {
    const cel1 = { id: 'c1', kind: 'rank_up' as const, payload: 'Athlete', queuedAt: '' };
    const cel2 = { id: 'c2', kind: 'streak_milestone' as const, payload: '7', queuedAt: '' };
    const s1 = reducer(baseState(), { type: 'QUEUE_CELEBRATION', payload: cel1 });
    const s2 = reducer(s1, { type: 'QUEUE_CELEBRATION', payload: cel2 });
    const s3 = reducer(s2, { type: 'DEQUEUE_CELEBRATION', payload: 'c1' });
    expect(s3.pendingCelebrations).toHaveLength(1);
    expect(s3.pendingCelebrations[0]?.id).toBe('c2');
  });

  it('DEQUEUE_CELEBRATION is a no-op for unknown id', () => {
    const cel = { id: 'c1', kind: 'rank_up' as const, payload: 'Athlete', queuedAt: '' };
    const s1 = reducer(baseState(), { type: 'QUEUE_CELEBRATION', payload: cel });
    const s2 = reducer(s1, { type: 'DEQUEUE_CELEBRATION', payload: 'nonexistent' });
    expect(s2.pendingCelebrations).toHaveLength(1);
  });

  it('DEQUEUE_CELEBRATION empties queue when last item removed', () => {
    const cel = { id: 'c1', kind: 'achievement' as const, payload: 'first-workout', queuedAt: '' };
    const s1 = reducer(baseState(), { type: 'QUEUE_CELEBRATION', payload: cel });
    const s2 = reducer(s1, { type: 'DEQUEUE_CELEBRATION', payload: 'c1' });
    expect(s2.pendingCelebrations).toHaveLength(0);
  });
});
