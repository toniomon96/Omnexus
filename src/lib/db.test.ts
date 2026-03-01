import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock ──────────────────────────────────────────────────────────────
// vi.hoisted ensures this runs before imports so vi.mock can reference it.
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
}));

import { upsertSession, fetchHistory, deleteCustomProgramDb } from './db';
import type { WorkoutSession } from '../types';

// ── Builder helper ─────────────────────────────────────────────────────────────
/**
 * Creates a mock Supabase query builder that is thenable (awaitable)
 * and supports method chaining (.select, .eq, .order, .upsert, .delete).
 */
function createBuilder(resolveWith: { data?: unknown; error?: { message: string } | null }) {
  const self: Record<string, unknown> = {};
  // Chainable methods return the same builder so the chain can continue
  self.select = vi.fn().mockReturnValue(self);
  self.eq = vi.fn().mockReturnValue(self);
  self.order = vi.fn().mockReturnValue(self);
  self.delete = vi.fn().mockReturnValue(self);
  // Terminal methods that resolve directly
  self.upsert = vi.fn().mockResolvedValue({ error: resolveWith.error ?? null });
  self.single = vi.fn().mockResolvedValue(resolveWith);
  // Make the builder itself thenable so `await builder` works
  self.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve);
  self.catch = (reject: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).catch(reject);
  self.finally = (fn: () => void) =>
    Promise.resolve(resolveWith).finally(fn);
  return self;
}

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeSession = (): WorkoutSession => ({
  id: 'session-1',
  programId: 'prog-1',
  trainingDayIndex: 0,
  startedAt: '2025-01-01T10:00:00Z',
  completedAt: '2025-01-01T11:00:00Z',
  durationSeconds: 3600,
  exercises: [],
  totalVolumeKg: 0,
});

// ── upsertSession ─────────────────────────────────────────────────────────────
describe('upsertSession', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('resolves without throwing when Supabase returns no error', async () => {
    const builder = createBuilder({ error: null });
    mockFrom.mockReturnValue(builder);

    await expect(upsertSession(makeSession(), 'user-1')).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('workout_sessions');
    expect(builder.upsert).toHaveBeenCalled();
  });

  it('throws an error with the Supabase message when upsert fails', async () => {
    const builder = createBuilder({ error: { message: 'duplicate key' } });
    mockFrom.mockReturnValue(builder);

    await expect(upsertSession(makeSession(), 'user-1')).rejects.toThrow(
      '[upsertSession] duplicate key',
    );
  });
});

// ── fetchHistory ──────────────────────────────────────────────────────────────
describe('fetchHistory', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns empty arrays when Supabase returns null data', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await fetchHistory('user-1');
    expect(result.sessions).toEqual([]);
    expect(result.personalRecords).toEqual([]);
  });

  it('maps session rows to WorkoutSession objects', async () => {
    const sessionRow = {
      id: 's1',
      program_id: 'prog',
      training_day_index: 0,
      started_at: '2025-01-01T10:00:00Z',
      completed_at: null,
      duration_seconds: null,
      exercises: [],
      total_volume_kg: 500,
      notes: null,
    };

    // Return different data per table
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workout_sessions')
        return createBuilder({ data: [sessionRow], error: null });
      // personal_records
      return createBuilder({ data: [], error: null });
    });

    const result = await fetchHistory('user-1');
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe('s1');
    expect(result.sessions[0].programId).toBe('prog');
    expect(result.sessions[0].totalVolumeKg).toBe(500);
    expect(result.sessions[0].completedAt).toBeUndefined();
  });

  it('maps personal record rows correctly', async () => {
    const prRow = {
      exercise_id: 'bench-press',
      weight: 120,
      reps: 3,
      achieved_at: '2025-01-01T11:00:00Z',
      session_id: 's1',
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'personal_records')
        return createBuilder({ data: [prRow], error: null });
      return createBuilder({ data: [], error: null });
    });

    const result = await fetchHistory('user-1');
    expect(result.personalRecords).toHaveLength(1);
    expect(result.personalRecords[0].exerciseId).toBe('bench-press');
    expect(result.personalRecords[0].weight).toBe(120);
  });

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'permission denied' } }),
    );

    await expect(fetchHistory('user-1')).rejects.toThrow('permission denied');
  });
});

// ── deleteCustomProgramDb ─────────────────────────────────────────────────────
describe('deleteCustomProgramDb', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls from("custom_programs").delete().eq("id", id)', async () => {
    const builder = createBuilder({ error: null });
    mockFrom.mockReturnValue(builder);

    await deleteCustomProgramDb('prog-123');

    expect(mockFrom).toHaveBeenCalledWith('custom_programs');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'prog-123');
  });

  it('throws when Supabase returns an error', async () => {
    const builder = createBuilder({ error: { message: 'row not found' } });
    mockFrom.mockReturnValue(builder);

    await expect(deleteCustomProgramDb('prog-bad')).rejects.toThrow(
      '[deleteCustomProgramDb] row not found',
    );
  });
});
