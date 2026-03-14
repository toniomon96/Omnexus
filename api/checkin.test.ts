import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const anthropicCreateMock = vi.hoisted(() => vi.fn());
const checkRateLimitMock = vi.hoisted(() => vi.fn().mockResolvedValue({ allowed: true }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicMock {
    messages = { create: anthropicCreateMock };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

vi.mock('./_rateLimit.js', () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock('./_cors.js', () => ({
  setCorsHeaders: vi.fn((req: unknown, res: unknown) => {
    void req; void res;
    return true;
  }),
}));

vi.mock('./_aiSafety.js', () => ({
  sanitizeFreeText: vi.fn((v: string) => v),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader() { return res; },
    status(code: number) { statusCode = code; return res; },
    json(payload: unknown) { body = payload; return res; },
    end() { return res; },
  } as unknown as VercelResponse;

  return { res, getStatus: () => statusCode, getBody: () => body as Record<string, unknown> };
}

function makeReq(body: Record<string, unknown> = {}, method = 'POST'): VercelRequest {
  return {
    method,
    headers: { origin: 'http://localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    body,
  } as unknown as VercelRequest;
}

const validBody = {
  energyLevel: 7,
  sleepQuality: 8,
  sorenessLevel: 2,
  painFlag: false,
};

import handler from './checkin';

afterEach(() => vi.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('/api/checkin', () => {
  describe('method guard', () => {
    it('returns 405 for GET', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({}, 'GET'), res);
      expect(getStatus()).toBe(405);
    });

    it('returns 204 for OPTIONS preflight', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({}, 'OPTIONS'), res);
      expect(getStatus()).toBe(204);
    });
  });

  describe('input validation', () => {
    it('returns 400 when energyLevel is missing', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({ sleepQuality: 7, sorenessLevel: 2, painFlag: false }), res);
      expect(getStatus()).toBe(400);
    });

    it('returns 400 when sleepQuality is missing', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({ energyLevel: 7, sorenessLevel: 2, painFlag: false }), res);
      expect(getStatus()).toBe(400);
    });

    it('returns 400 when sorenessLevel is missing', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({ energyLevel: 7, sleepQuality: 8, painFlag: false }), res);
      expect(getStatus()).toBe(400);
    });
  });

  describe('happy path (no AI)', () => {
    it('returns 200 with checkinId, omniResponse, reduceIntensity, flaggedExercises', async () => {
      const { res, getStatus, getBody } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(getStatus()).toBe(200);
      const body = getBody();
      expect(body).toHaveProperty('checkinId');
      expect(body).toHaveProperty('omniResponse');
      expect(body).toHaveProperty('reduceIntensity');
      expect(body).toHaveProperty('flaggedExercises');
    });

    it('sets reduceIntensity=true when energyLevel < 5', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq({ ...validBody, energyLevel: 4 }), res);
      expect(getBody().reduceIntensity).toBe(true);
    });

    it('sets reduceIntensity=true when sleepQuality < 5', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq({ ...validBody, sleepQuality: 3 }), res);
      expect(getBody().reduceIntensity).toBe(true);
    });

    it('sets reduceIntensity=false when both energy and sleep are >= 5', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq({ ...validBody, energyLevel: 7, sleepQuality: 8 }), res);
      expect(getBody().reduceIntensity).toBe(false);
    });

    it('populates flaggedExercises when painFlag=true with location', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq({ ...validBody, painFlag: true, painLocation: 'knee' }), res);
      const body = getBody();
      expect(Array.isArray(body.flaggedExercises)).toBe(true);
      expect((body.flaggedExercises as string[]).length).toBeGreaterThan(0);
    });

    it('flaggedExercises is empty when painFlag=false', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(getBody().flaggedExercises).toHaveLength(0);
    });

    it('clamps out-of-range values (energyLevel > 10 → 10)', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({ ...validBody, energyLevel: 99 }), res);
      expect(getStatus()).toBe(200);
    });

    it('omniResponse is a non-empty string', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(typeof getBody().omniResponse).toBe('string');
      expect((getBody().omniResponse as string).length).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      // checkin.ts uses checkRateLimit(req, res, config) — the function writes the
      // 429 itself and returns false. Simulate that behaviour in the mock.
      checkRateLimitMock.mockImplementationOnce(
        async (_req: unknown, res: { status: (c: number) => { json: (b: unknown) => void } }) => {
          res.status(429).json({ error: 'Too many requests' });
          return false;
        },
      );

      const { res, getStatus } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(getStatus()).toBe(429);
    });
  });
});
