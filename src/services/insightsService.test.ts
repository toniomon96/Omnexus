import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildInsightRequest } from './insightsService';
import type { WorkoutSession, User } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const user: User = {
  id: 'u1',
  name: 'Test',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  onboardedAt: '2025-01-01T00:00:00Z',
  theme: 'dark',
};

function makeSession(id: string, startedAt: string, completedAt: string): WorkoutSession {
  return {
    id,
    programId: 'prog',
    trainingDayIndex: 0,
    startedAt,
    completedAt,
    durationSeconds: 3600,
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        sets: [
          { setNumber: 1, weight: 80, reps: 8, completed: true, timestamp: '' },
        ],
      },
    ],
    totalVolumeKg: 640,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('buildInsightRequest', () => {
  // Pin "now" so the 28-day cutoff works against the test dates
  beforeEach(() => vi.useFakeTimers({ now: new Date('2025-03-15T12:00:00Z') }));
  afterEach(() => vi.useRealTimers());

  it('returns null for empty sessions', async () => {
    await expect(buildInsightRequest([], user)).resolves.toBeNull();
  });

  it('returns null when all sessions lack completedAt', async () => {
    const session: WorkoutSession = {
      id: 's1',
      programId: 'prog',
      trainingDayIndex: 0,
      startedAt: '2025-03-01T10:00:00Z',
      exercises: [],
      totalVolumeKg: 0,
    };
    await expect(buildInsightRequest([session], user)).resolves.toBeNull();
  });

  it('returns an InsightRequest for valid sessions', async () => {
    const session = makeSession('s1', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z');
    const result = await buildInsightRequest([session], user);
    expect(result).not.toBeNull();
    expect(result!.userGoal).toBe('hypertrophy');
    expect(result!.userExperience).toBe('intermediate');
    expect(result!.workoutSummary).toContain('Sessions in last 4 weeks');
  });

  it('includes exercise names in summary instead of IDs', async () => {
    const session = makeSession('s1', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z');
    const result = await buildInsightRequest([session], user);
    expect(result!.workoutSummary).toContain('Barbell Bench Press');
  });

  it('limits to 20 sessions max', async () => {
    const sessions: WorkoutSession[] = [];
    for (let i = 0; i < 25; i++) {
      const day = String(i + 1).padStart(2, '0');
      sessions.push(
        makeSession(`s${i}`, `2025-03-${day}T10:00:00Z`, `2025-03-${day}T11:00:00Z`),
      );
    }
    const result = await buildInsightRequest(sessions, user);
    // The summary should contain session log lines — count them
    const lines = result!.workoutSummary.split('\n').filter((l) => l.includes('kg volume'));
    expect(lines.length).toBeLessThanOrEqual(20);
  });

  it('excludes sessions older than 28 days', async () => {
    const old = makeSession('old', '2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z');
    const recent = makeSession('new', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z');
    const result = await buildInsightRequest([old, recent], user);
    // Only 1 session should be in the summary
    expect(result!.workoutSummary).toContain('Sessions in last 4 weeks: 1');
  });

  it('computes average volume correctly', async () => {
    const s1 = makeSession('s1', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z');
    const s2 = makeSession('s2', '2025-03-02T10:00:00Z', '2025-03-02T11:00:00Z');
    // Each session has totalVolumeKg = 640, avg = 640
    const result = await buildInsightRequest([s1, s2], user);
    expect(result!.workoutSummary).toContain('Average session volume: 640 kg');
  });

  it('formats summary volume in lbs when requested', async () => {
    const session = makeSession('s1', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z');
    const result = await buildInsightRequest([session], user, 'lbs');
    expect(result!.workoutSummary).toContain('Average session volume: 1411 lbs');
  });
});
