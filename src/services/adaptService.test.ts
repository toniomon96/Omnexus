import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAdaptation,
  generateMissions,
  generatePersonalChallenge,
  getPeerInsights,
  type AdaptRequest,
  type GenerateMissionsRequest,
  type PersonalChallengeRequest,
  type PeerInsightsRequest,
} from './adaptService';

vi.mock('../lib/api', () => ({
  apiBase: '',
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  },
}));

const adaptRequest: AdaptRequest = {
  userId: 'user-1',
  exerciseSets: [
    {
      exerciseId: 'barbell-bench-press',
      exerciseName: 'Barbell Bench Press',
      sets: [
        { setNumber: 1, weight: 80, reps: 8, completed: true, timestamp: '2025-01-01T10:00:00Z' },
      ],
    },
  ],
};

const missionsRequest: GenerateMissionsRequest = {
  userId: 'user-1',
  programId: 'prog-1',
  programName: 'Strength Block',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  daysPerWeek: 4,
  durationWeeks: 8,
};

const challengeRequest: PersonalChallengeRequest = {
  userId: 'user-1',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  recentStats: { weeklyVolume: 5000, sessionsLast30Days: 12, avgRpe: 7 },
};

const peerRequest: PeerInsightsRequest = {
  userId: 'user-1',
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
};

describe('adaptService', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('getAdaptation', () => {
    it('POSTs to /api/adapt and returns parsed result', async () => {
      const expected = { adaptations: [] };
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => expected,
        }) as unknown as Response),
      );

      const result = await getAdaptation(adaptRequest);

      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/adapt');
      expect(JSON.parse(init.body as string)).toEqual(adaptRequest);
      expect(result).toEqual(expected);
    });

    it('throws on non-OK response with server error message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Rate limited' }),
        }) as unknown as Response),
      );

      await expect(getAdaptation(adaptRequest)).rejects.toThrow('Rate limited');
    });

    it('throws with "Request failed" fallback when error body is unparseable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 500,
          json: async () => { throw new Error('bad json'); },
        }) as unknown as Response),
      );

      await expect(getAdaptation(adaptRequest)).rejects.toThrow('Request failed');
    });
  });

  describe('generateMissions', () => {
    it('POSTs to /api/generate-missions and returns missions', async () => {
      const expected = { missions: [{ id: 'm1', title: 'Add 5kg to squat' }] };
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => expected,
        }) as unknown as Response),
      );

      const result = await generateMissions(missionsRequest);

      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/generate-missions');
      expect(JSON.parse(init.body as string)).toEqual(missionsRequest);
      expect(result).toEqual(expected);
    });
  });

  describe('generatePersonalChallenge', () => {
    it('POSTs to /api/generate-personal-challenge and returns challenge', async () => {
      const expected = { challenge: { id: 'ch1', title: '10 sessions' } };
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => expected,
        }) as unknown as Response),
      );

      const result = await generatePersonalChallenge(challengeRequest);

      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/generate-personal-challenge');
      expect(result).toEqual(expected);
    });
  });

  describe('getPeerInsights', () => {
    it('POSTs to /api/peer-insights and returns narrative', async () => {
      const expected = { narrative: 'Peers are crushing it', peerCount: 42, hasEnoughPeers: true };
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => expected,
        }) as unknown as Response),
      );

      const result = await getPeerInsights(peerRequest);

      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/peer-insights');
      expect(JSON.parse(init.body as string)).toEqual(peerRequest);
      expect(result).toEqual(expected);
    });
  });

  describe('Authorization header', () => {
    it('includes Bearer token when session exists', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { access_token: 'tok-abc' } as never },
        error: null,
      });

      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => ({ adaptations: [] }),
        }) as unknown as Response),
      );

      await getAdaptation(adaptRequest);

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer tok-abc');
    });

    it('omits Authorization header when no session', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => ({ adaptations: [] }),
        }) as unknown as Response),
      );

      await getAdaptation(adaptRequest);

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });
  });
});
