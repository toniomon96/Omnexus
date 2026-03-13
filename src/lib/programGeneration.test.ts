import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── localStorage mock ────────────────────────────────────────────────────────
const store: Record<string, string> = {};
const lsMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (_i: number) => null,
};
vi.stubGlobal('localStorage', lsMock);
vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('test-program-id') });

// ── Module mocks (hoisted so they run before imports) ────────────────────────
const mockUpsertCustomProgram = vi.hoisted(() => vi.fn());
vi.mock('./db', () => ({
  upsertCustomProgram: mockUpsertCustomProgram,
}));

const mockSaveCustomProgram = vi.hoisted(() => vi.fn());
vi.mock('../utils/localStorage', () => ({
  saveCustomProgram: mockSaveCustomProgram,
  getCustomPrograms: vi.fn().mockReturnValue([]),
  getMostRecentFeedbackNote: vi.fn().mockReturnValue(undefined),
}));

vi.mock('./api', () => ({ apiBase: '' }));

// ── System under test ────────────────────────────────────────────────────────
import {
  startGeneration,
  getGenerationState,
  subscribeToGeneration,
  clearGenerationState,
} from './programGeneration';
import type { UserTrainingProfile } from '../types';

// ── Fixtures ─────────────────────────────────────────────────────────────────
const mockProfile: UserTrainingProfile = {
  goals: ['hypertrophy'],
  trainingAgeYears: 2,
  daysPerWeek: 4,
  sessionDurationMinutes: 60,
  equipment: ['barbell', 'dumbbell'],
  injuries: [],
  aiSummary: '',
};

const mockProgramPayload = {
  name: 'AI Hypertrophy Block',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  description: 'Test program',
  daysPerWeek: 4,
  estimatedDurationWeeks: 8,
  schedule: [],
  tags: ['strength'],
};

function mockFetch(ok: boolean, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('programGeneration state machine', () => {
  beforeEach(() => {
    lsMock.clear();
    vi.clearAllMocks();
    clearGenerationState(); // resets _running flag + removes localStorage key
  });

  it('emits "generating" synchronously before any await', async () => {
    mockUpsertCustomProgram.mockResolvedValue(undefined);
    mockFetch(true, { program: mockProgramPayload });

    const statuses: string[] = [];
    const unsub = subscribeToGeneration(s => statuses.push(s.status));

    const pending = startGeneration('user-1', mockProfile);
    // 'generating' must be pushed synchronously — before fetch or upsert complete
    expect(statuses[0]).toBe('generating');

    await pending;
    unsub();
  });

  it('saves generation state to localStorage immediately', () => {
    mockUpsertCustomProgram.mockResolvedValue(undefined);
    mockFetch(true, { program: mockProgramPayload });

    void startGeneration('user-1', mockProfile);

    const state = getGenerationState();
    expect(state).not.toBeNull();
    expect(state?.status).toBe('generating');
    expect(state?.userId).toBe('user-1');
    expect(state?.programId).toBe('test-program-id');
  });

  // ── Core regression test for the "No program found" bug ─────────────────
  it('emits "ready" only AFTER upsertCustomProgram resolves', async () => {
    // Control when the upsert resolves so we can assert the ordering
    let upsertResolve!: () => void;
    const upsertPending = new Promise<void>(res => { upsertResolve = res; });
    mockUpsertCustomProgram.mockReturnValue(upsertPending);
    mockFetch(true, { program: mockProgramPayload });

    const statuses: string[] = [];
    const unsub = subscribeToGeneration(s => statuses.push(s.status));

    const genPromise = startGeneration('user-1', mockProfile);

    // Drain microtask queue enough for fetch to resolve but NOT the upsert
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Must still be 'generating' — upsert hasn't resolved yet
    expect(statuses).not.toContain('ready');

    // Now let the upsert resolve
    upsertResolve();
    await genPromise;

    // Only NOW should 'ready' appear
    expect(statuses).toContain('ready');
    expect(statuses[statuses.length - 1]).toBe('ready');
    unsub();
  });

  it('still emits "ready" if upsertCustomProgram rejects (graceful degradation)', async () => {
    // Supabase write fails — program is saved locally but not in cloud
    mockUpsertCustomProgram.mockRejectedValue(new Error('Supabase unavailable'));
    mockFetch(true, { program: mockProgramPayload });

    const statuses: string[] = [];
    const unsub = subscribeToGeneration(s => statuses.push(s.status));

    await startGeneration('user-1', mockProfile);

    expect(statuses).toContain('ready');
    expect(statuses).not.toContain('error');
    // Local save still happened
    expect(mockSaveCustomProgram).toHaveBeenCalledOnce();
    unsub();
  });

  it('emits "error" and does not call upsert when API fetch fails', async () => {
    mockFetch(false, { error: 'Rate limit exceeded' });

    const statuses: string[] = [];
    const unsub = subscribeToGeneration(s => statuses.push(s.status));

    await startGeneration('user-1', mockProfile);

    expect(statuses).toContain('error');
    expect(statuses).not.toContain('ready');
    expect(mockUpsertCustomProgram).not.toHaveBeenCalled();
    expect(mockSaveCustomProgram).not.toHaveBeenCalled();
    unsub();
  });

  it('emits "error" when fetch throws (network offline)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

    const statuses: string[] = [];
    const unsub = subscribeToGeneration(s => statuses.push(s.status));

    await startGeneration('user-1', mockProfile);

    expect(statuses).toContain('error');
    expect(mockUpsertCustomProgram).not.toHaveBeenCalled();
    unsub();
  });

  it('does not start a second generation if one is already running', async () => {
    let firstResolve!: () => void;
    const firstPending = new Promise<void>(res => { firstResolve = res; });
    mockUpsertCustomProgram.mockReturnValue(firstPending);
    mockFetch(true, { program: mockProgramPayload });

    // Start first generation — don't await it
    const first = startGeneration('user-1', mockProfile);

    // Try to start a second — should be a no-op
    await startGeneration('user-1', mockProfile);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    firstResolve();
    await first;
  });

  it('persists "ready" status to localStorage', async () => {
    mockUpsertCustomProgram.mockResolvedValue(undefined);
    mockFetch(true, { program: mockProgramPayload });

    await startGeneration('user-1', mockProfile);

    const state = getGenerationState();
    expect(state?.status).toBe('ready');
    expect(state?.programId).toBe('test-program-id');
  });

  it('clearGenerationState removes localStorage key', async () => {
    mockUpsertCustomProgram.mockResolvedValue(undefined);
    mockFetch(true, { program: mockProgramPayload });

    await startGeneration('user-1', mockProfile);
    expect(getGenerationState()).not.toBeNull();

    clearGenerationState();
    expect(getGenerationState()).toBeNull();
  });
});
