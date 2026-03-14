import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recommendProgram, getNextWorkout, advanceProgramCursor, getWeeklyCompletionCount } from './programUtils';
import type { Program, TrainingDay } from '../types';

// ─── localStorage mock (Node env) ────────────────────────────────────────────

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
});
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDay(label: string): TrainingDay {
  return { label, type: 'full-body', exercises: [] };
}

function makeProgram(id: string, goal: Program['goal'], level: Program['experienceLevel'], schedule?: TrainingDay[]): Program {
  return {
    id,
    name: `Test ${id}`,
    goal,
    experienceLevel: level,
    description: '',
    daysPerWeek: 3,
    estimatedDurationWeeks: 12,
    schedule: schedule ?? [],
    tags: [],
  };
}

const testPrograms: Program[] = [
  makeProgram('hyp-beg', 'hypertrophy',    'beginner'),
  makeProgram('hyp-int', 'hypertrophy',    'intermediate'),
  makeProgram('fat-beg', 'fat-loss',       'beginner'),
  makeProgram('fat-int', 'fat-loss',       'intermediate'),
  makeProgram('gen-beg', 'general-fitness','beginner'),
  makeProgram('gen-int', 'general-fitness','intermediate'),
];

// ── recommendProgram ──────────────────────────────────────────────────────────
describe('recommendProgram', () => {
  it('returns a program matching the goal', () => {
    const result = recommendProgram('fat-loss', 'beginner', testPrograms);
    expect(result?.goal).toBe('fat-loss');
  });

  it('returns a program matching the experience level', () => {
    const result = recommendProgram('hypertrophy', 'intermediate', testPrograms);
    expect(result?.experienceLevel).toBe('intermediate');
  });

  it('returns the exact match for a goal + level combination', () => {
    const result = recommendProgram('hypertrophy', 'beginner', testPrograms);
    expect(result?.id).toBe('hyp-beg');
  });

  it('returns the correct program for fat-loss + intermediate', () => {
    const result = recommendProgram('fat-loss', 'intermediate', testPrograms);
    expect(result?.id).toBe('fat-int');
  });

  it('returns undefined when no program matches the experience level', () => {
    const result = recommendProgram('hypertrophy', 'advanced', testPrograms);
    expect(result).toBeUndefined();
  });

  it('returns undefined for an empty program list', () => {
    const result = recommendProgram('hypertrophy', 'beginner', []);
    expect(result).toBeUndefined();
  });
});

// ── getNextWorkout ────────────────────────────────────────────────────────────

describe('getNextWorkout', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.clearAllMocks();
  });

  it('returns the first day when no cursor is stored', () => {
    const program = makeProgram('p1', 'hypertrophy', 'beginner', [makeDay('Day A'), makeDay('Day B')]);
    const result = getNextWorkout(program);
    expect(result.dayIndex).toBe(0);
    expect(result.day.label).toBe('Day A');
    expect(result.week).toBe(1);
  });

  it('clamps cursor to schedule length', () => {
    const program = makeProgram('p1', 'hypertrophy', 'beginner', [makeDay('Day A')]);
    // Manually set cursor beyond schedule length
    store['fit_program_day_cursor'] = JSON.stringify({ p1: 5 });
    const result = getNextWorkout(program);
    expect(result.dayIndex).toBe(0); // clamped to last valid index
  });
});

// ── advanceProgramCursor ──────────────────────────────────────────────────────

describe('advanceProgramCursor', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.clearAllMocks();
  });

  it('advances day cursor by 1', () => {
    const program = makeProgram('p1', 'hypertrophy', 'beginner', [makeDay('A'), makeDay('B'), makeDay('C')]);
    advanceProgramCursor(program);
    const next = getNextWorkout(program);
    expect(next.dayIndex).toBe(1);
  });

  it('wraps to day 0 and increments week at end of schedule', () => {
    const program = makeProgram('p1', 'hypertrophy', 'beginner', [makeDay('A'), makeDay('B')]);
    advanceProgramCursor(program); // day 0 → 1
    advanceProgramCursor(program); // day 1 → 0, week 1 → 2
    const next = getNextWorkout(program);
    expect(next.dayIndex).toBe(0);
    expect(next.week).toBe(2);
  });
});

// ── getWeeklyCompletionCount ──────────────────────────────────────────────────

describe('getWeeklyCompletionCount', () => {
  const program = makeProgram('p1', 'hypertrophy', 'beginner');

  it('counts sessions within the week window', () => {
    const weekStart = '2025-03-03T00:00:00Z'; // Monday
    const dates = [
      '2025-03-03T10:00:00Z',
      '2025-03-05T10:00:00Z',
      '2025-03-07T10:00:00Z',
    ];
    expect(getWeeklyCompletionCount(program, [], weekStart, dates)).toBe(3);
  });

  it('excludes sessions outside the week', () => {
    const weekStart = '2025-03-03T00:00:00Z';
    const dates = [
      '2025-02-28T10:00:00Z', // before
      '2025-03-05T10:00:00Z', // within
      '2025-03-11T10:00:00Z', // after
    ];
    expect(getWeeklyCompletionCount(program, [], weekStart, dates)).toBe(1);
  });

  it('returns 0 for no sessions', () => {
    expect(getWeeklyCompletionCount(program, [], '2025-03-03T00:00:00Z', [])).toBe(0);
  });
});

// ── isBlockComplete ───────────────────────────────────────────────────────────

import { isBlockComplete, getBlockStartDate } from './programUtils';

describe('isBlockComplete', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it('returns false when week cursor is at 1 and day cursor is 0', () => {
    const program = makeProgram('blk', 'hypertrophy', 'beginner', [makeDay('A')]);
    (program as { estimatedDurationWeeks: number }).estimatedDurationWeeks = 8;
    expect(isBlockComplete(program)).toBe(false);
  });

  it('returns false when week is at the final week but not past it', () => {
    const program = makeProgram('blk2', 'hypertrophy', 'beginner', [makeDay('A'), makeDay('B')]);
    (program as { estimatedDurationWeeks: number }).estimatedDurationWeeks = 8;
    // Set week cursor to exactly 8 (not yet past)
    store['fit_program_week_cursor'] = JSON.stringify({ blk2: 8 });
    store['fit_program_day_cursor'] = JSON.stringify({ blk2: 0 });
    expect(isBlockComplete(program)).toBe(false);
  });

  it('returns true when week cursor has advanced past estimatedDurationWeeks and day is 0', () => {
    const program = makeProgram('blk3', 'hypertrophy', 'beginner', [makeDay('A')]);
    (program as { estimatedDurationWeeks: number }).estimatedDurationWeeks = 8;
    store['fit_program_week_cursor'] = JSON.stringify({ blk3: 9 });
    store['fit_program_day_cursor'] = JSON.stringify({ blk3: 0 });
    expect(isBlockComplete(program)).toBe(true);
  });

  it('returns false when week is past limit but day cursor is non-zero (mid-week)', () => {
    const program = makeProgram('blk4', 'hypertrophy', 'beginner', [makeDay('A'), makeDay('B')]);
    (program as { estimatedDurationWeeks: number }).estimatedDurationWeeks = 8;
    store['fit_program_week_cursor'] = JSON.stringify({ blk4: 9 });
    store['fit_program_day_cursor'] = JSON.stringify({ blk4: 1 });
    expect(isBlockComplete(program)).toBe(false);
  });

  it('uses 8 as default estimatedDurationWeeks when not set', () => {
    const program = makeProgram('blk5', 'hypertrophy', 'beginner', [makeDay('A')]);
    // Cast to remove the field so the function falls back to its default of 8
    const programNoWeeks = { ...program } as typeof program;
    delete (programNoWeeks as { estimatedDurationWeeks?: number }).estimatedDurationWeeks;
    store['fit_program_week_cursor'] = JSON.stringify({ blk5: 9 });
    store['fit_program_day_cursor'] = JSON.stringify({ blk5: 0 });
    expect(isBlockComplete(programNoWeeks)).toBe(true);
  });
});

// ── getBlockStartDate ─────────────────────────────────────────────────────────

describe('getBlockStartDate', () => {
  it('returns the earliest session start date for the program', () => {
    const sessions = [
      { programId: 'prog-1', startedAt: '2025-03-10T10:00:00Z' },
      { programId: 'prog-1', startedAt: '2025-03-05T10:00:00Z' },
      { programId: 'prog-1', startedAt: '2025-03-15T10:00:00Z' },
    ];
    expect(getBlockStartDate('prog-1', sessions)).toBe('2025-03-05T10:00:00Z');
  });

  it('returns null when no sessions match the program', () => {
    const sessions = [
      { programId: 'other', startedAt: '2025-03-10T10:00:00Z' },
    ];
    expect(getBlockStartDate('prog-1', sessions)).toBeNull();
  });

  it('returns null for an empty session array', () => {
    expect(getBlockStartDate('prog-1', [])).toBeNull();
  });

  it('returns the single session date when there is only one session', () => {
    const sessions = [{ programId: 'solo', startedAt: '2025-06-01T08:00:00Z' }];
    expect(getBlockStartDate('solo', sessions)).toBe('2025-06-01T08:00:00Z');
  });

  it('ignores sessions from other programs', () => {
    const sessions = [
      { programId: 'prog-a', startedAt: '2025-01-01T00:00:00Z' },
      { programId: 'prog-b', startedAt: '2025-03-01T00:00:00Z' },
      { programId: 'prog-a', startedAt: '2025-02-01T00:00:00Z' },
    ];
    expect(getBlockStartDate('prog-b', sessions)).toBe('2025-03-01T00:00:00Z');
  });
});
