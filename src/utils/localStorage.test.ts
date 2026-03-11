import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal localStorage mock for Node environment
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

// window + matchMedia stub (used by getTheme)
vi.stubGlobal('window', {
  matchMedia: vi.fn(() => ({ matches: false })),
  localStorage: localStorageMock,
});

import {
  getUser,
  setUser,
  clearUser,
  getHistory,
  appendSession,
  updatePersonalRecords,
  getActiveSession,
  setActiveSession,
  clearActiveSession,
  getTheme,
  setTheme,
  getProgramWeekCursor,
  setProgramWeekCursor,
  getProgramDayCursor,
  setProgramDayCursor,
  resetProgramCursors,
  getLearningProgress,
  setLearningProgress,
  getInsightSessions,
  appendInsightSession,
  clearInsightSessions,
  getCustomPrograms,
  saveCustomProgram,
  deleteCustomProgram,
  getMeasurements,
  saveMeasurement,
  removeMeasurement,
  getGuestProfile,
  setGuestProfile,
  clearGuestProfile,
  getWeightUnit,
  setWeightUnit,
} from './localStorage';
import type { User, WorkoutSession, PersonalRecord, LearningProgress, Program, InsightSession } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'u1',
  name: 'Test User',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  onboardedAt: '2025-01-01T00:00:00Z',
  theme: 'dark',
};

function mockSession(id: string): WorkoutSession {
  return {
    id,
    programId: 'prog-1',
    trainingDayIndex: 0,
    startedAt: '2025-03-01T10:00:00Z',
    exercises: [],
    totalVolumeKg: 500,
  };
}

function mockProgram(id: string): Program {
  return {
    id,
    name: `Program ${id}`,
    goal: 'hypertrophy',
    experienceLevel: 'beginner',
    description: '',
    daysPerWeek: 3,
    estimatedDurationWeeks: 12,
    schedule: [],
    tags: [],
  };
}

function makeInsight(id: string): InsightSession {
  return {
    id,
    category: 'general-health',
    messages: [{ id: 'm1', role: 'user', content: 'hi', timestamp: '2025-01-01' }],
    createdAt: '2025-01-01',
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ── User ──

describe('User storage', () => {
  it('returns null when no user stored', () => {
    expect(getUser()).toBeNull();
  });

  it('stores and retrieves user', () => {
    setUser(mockUser);
    expect(getUser()).toEqual(mockUser);
  });

  it('clears user', () => {
    setUser(mockUser);
    clearUser();
    expect(getUser()).toBeNull();
  });
});

// ── History ──

describe('History storage', () => {
  it('returns empty history by default', () => {
    const h = getHistory();
    expect(h.sessions).toEqual([]);
    expect(h.personalRecords).toEqual([]);
  });

  it('appends sessions', () => {
    appendSession(mockSession('s1'));
    appendSession(mockSession('s2'));
    expect(getHistory().sessions).toHaveLength(2);
  });

  it('merges personal records — replaces existing for same exercise', () => {
    const pr1: PersonalRecord = {
      exerciseId: 'bench',
      weight: 80,
      reps: 5,
      achievedAt: '2025-01-01T00:00:00Z',
      sessionId: 's1',
    };
    const pr2: PersonalRecord = {
      exerciseId: 'bench',
      weight: 90,
      reps: 3,
      achievedAt: '2025-02-01T00:00:00Z',
      sessionId: 's2',
    };
    updatePersonalRecords([pr1]);
    updatePersonalRecords([pr2]);
    const prs = getHistory().personalRecords;
    expect(prs).toHaveLength(1);
    expect(prs[0].weight).toBe(90);
  });

  it('adds new exercises without removing existing records', () => {
    const pr1: PersonalRecord = {
      exerciseId: 'bench',
      weight: 80,
      reps: 5,
      achievedAt: '2025-01-01T00:00:00Z',
      sessionId: 's1',
    };
    const pr2: PersonalRecord = {
      exerciseId: 'squat',
      weight: 120,
      reps: 3,
      achievedAt: '2025-02-01T00:00:00Z',
      sessionId: 's2',
    };
    updatePersonalRecords([pr1]);
    updatePersonalRecords([pr2]);
    expect(getHistory().personalRecords).toHaveLength(2);
  });
});

// ── Active Session ──

describe('Active session storage', () => {
  it('returns null when no active session', () => {
    expect(getActiveSession()).toBeNull();
  });

  it('stores and clears active session', () => {
    const session = mockSession('active');
    setActiveSession(session);
    expect(getActiveSession()?.id).toBe('active');
    clearActiveSession();
    expect(getActiveSession()).toBeNull();
  });
});

// ── Theme ──

describe('Theme storage', () => {
  it('returns light when no theme stored and prefers-color-scheme is light', () => {
    expect(getTheme()).toBe('light');
  });

  it('stores and retrieves theme', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
  });
});

describe('Weight unit storage', () => {
  it('defaults to lbs', () => {
    expect(getWeightUnit()).toBe('lbs');
  });

  it('stores and retrieves weight unit', () => {
    setWeightUnit('lbs');
    expect(getWeightUnit()).toBe('lbs');
  });

  it('falls back to lbs for invalid stored values', () => {
    localStorageMock.setItem('omnexus_weight_unit', JSON.stringify('stone'));
    expect(getWeightUnit()).toBe('lbs');
  });
});

// ── Measurements ──

describe('Measurement storage', () => {
  it('stores and filters measurements by user and metric', () => {
    saveMeasurement({
      userId: 'u1',
      metric: 'weight',
      value: 80,
      unit: 'kg',
      measuredAt: '2025-03-01',
    });
    saveMeasurement({
      userId: 'u1',
      metric: 'waist',
      value: 82,
      unit: 'cm',
      measuredAt: '2025-03-02',
    });
    saveMeasurement({
      userId: 'u2',
      metric: 'weight',
      value: 90,
      unit: 'kg',
      measuredAt: '2025-03-03',
    });

    expect(getMeasurements('u1')).toHaveLength(2);
    expect(getMeasurements('u1', 'weight')).toHaveLength(1);
    expect(getMeasurements('u2', 'weight')).toHaveLength(1);
  });

  it('removes only the matching measurement for the user', () => {
    const first = saveMeasurement({
      userId: 'u1',
      metric: 'weight',
      value: 80,
      unit: 'kg',
      measuredAt: '2025-03-01',
    });
    saveMeasurement({
      userId: 'u1',
      metric: 'weight',
      value: 81,
      unit: 'kg',
      measuredAt: '2025-03-02',
    });

    removeMeasurement(first.id, 'u1');

    const remaining = getMeasurements('u1', 'weight');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].value).toBe(81);
  });
});

// ── Program Cursors ──

describe('Program cursor storage', () => {
  it('defaults week cursor to 1', () => {
    expect(getProgramWeekCursor('prog-1')).toBe(1);
  });

  it('defaults day cursor to 0', () => {
    expect(getProgramDayCursor('prog-1')).toBe(0);
  });

  it('stores and retrieves cursors', () => {
    setProgramWeekCursor('prog-1', 3);
    setProgramDayCursor('prog-1', 2);
    expect(getProgramWeekCursor('prog-1')).toBe(3);
    expect(getProgramDayCursor('prog-1')).toBe(2);
  });

  it('tracks cursors independently per program', () => {
    setProgramWeekCursor('a', 5);
    setProgramWeekCursor('b', 2);
    expect(getProgramWeekCursor('a')).toBe(5);
    expect(getProgramWeekCursor('b')).toBe(2);
  });

  it('resets cursors to defaults', () => {
    setProgramWeekCursor('prog-1', 5);
    setProgramDayCursor('prog-1', 3);
    resetProgramCursors('prog-1');
    expect(getProgramWeekCursor('prog-1')).toBe(1);
    expect(getProgramDayCursor('prog-1')).toBe(0);
  });
});

// ── Learning Progress ──

describe('Learning progress storage', () => {
  it('returns empty progress by default', () => {
    const p = getLearningProgress();
    expect(p.completedLessons).toEqual([]);
    expect(p.completedModules).toEqual([]);
    expect(p.completedCourses).toEqual([]);
    expect(p.quizScores).toEqual({});
  });

  it('stores and retrieves learning progress', () => {
    const progress: LearningProgress = {
      completedLessons: ['l1', 'l2'],
      completedModules: ['m1'],
      completedCourses: [],
      quizScores: { m1: { score: 80, correctCount: 8, totalQuestions: 10, attemptedAt: '2025-01-01T00:00:00Z' } },
      lastActivityAt: '2025-01-01T00:00:00Z',
    };
    setLearningProgress(progress);
    expect(getLearningProgress()).toEqual(progress);
  });
});

// ── Insight Sessions ──

describe('Insight sessions storage', () => {
  it('returns empty array by default', () => {
    expect(getInsightSessions()).toEqual([]);
  });

  it('prepends new sessions', () => {
    appendInsightSession(makeInsight('i1'));
    appendInsightSession(makeInsight('i2'));
    const sessions = getInsightSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('i2'); // most recent first
  });

  it('trims to 50 sessions max', () => {
    for (let i = 0; i < 55; i++) {
      appendInsightSession(makeInsight(`i${i}`));
    }
    expect(getInsightSessions()).toHaveLength(50);
  });

  it('clears insight sessions', () => {
    appendInsightSession(makeInsight('i1'));
    clearInsightSessions();
    expect(getInsightSessions()).toEqual([]);
  });
});

// ── Custom Programs ──

describe('Custom programs storage', () => {
  it('returns empty array by default', () => {
    expect(getCustomPrograms()).toEqual([]);
  });

  it('saves a new program', () => {
    saveCustomProgram(mockProgram('p1'));
    expect(getCustomPrograms()).toHaveLength(1);
  });

  it('updates existing program by id', () => {
    saveCustomProgram(mockProgram('p1'));
    const updated = { ...mockProgram('p1'), name: 'Updated' };
    saveCustomProgram(updated);
    const programs = getCustomPrograms();
    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('Updated');
  });

  it('deletes a program by id', () => {
    saveCustomProgram(mockProgram('p1'));
    saveCustomProgram(mockProgram('p2'));
    deleteCustomProgram('p1');
    const programs = getCustomPrograms();
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe('p2');
  });
});

// ── Guest Profile ──

describe('Guest profile storage', () => {
  it('returns null when no guest profile', () => {
    expect(getGuestProfile()).toBeNull();
  });

  it('stores guest profile and also writes to user key', () => {
    const guest = { ...mockUser, isGuest: true };
    setGuestProfile(guest);
    expect(getGuestProfile()?.isGuest).toBe(true);
    // setGuestProfile also writes to the user key
    expect(getUser()?.isGuest).toBe(true);
  });

  it('clears guest profile', () => {
    setGuestProfile({ ...mockUser, isGuest: true });
    clearGuestProfile();
    expect(getGuestProfile()).toBeNull();
  });
});

// ── Error resilience ──

describe('Error resilience', () => {
  it('returns fallback when localStorage has invalid JSON', () => {
    localStorageMock.setItem('fit_user', 'not-valid-json{{{');
    expect(getUser()).toBeNull();
  });
});
