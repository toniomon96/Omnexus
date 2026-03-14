import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const checkRateLimitMock = vi.hoisted(() => vi.fn().mockResolvedValue({ allowed: true }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class AnthropicMock {
    messages = { create: vi.fn() };
  },
}));

vi.mock('./_rateLimit.js', () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock('./_cors.js', () => ({
  setCorsHeaders: vi.fn(),
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
    headers: { origin: 'http://localhost:3000', 'x-forwarded-for': '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
    body,
  } as unknown as VercelRequest;
}

const validBody = {
  firstName: 'Alex',
  programName: 'Strength Block A',
  startDate: '2025-01-06',
  endDate: '2025-03-02',
  consistencyPercent: 87.5,
  topPRs: [
    { exerciseName: 'Squat', weight: 120, reps: 5 },
    { exerciseName: 'Bench Press', weight: 90, reps: 5 },
  ],
  topMuscleGroup: 'quads',
  totalWorkouts: 28,
};

import handler from './progression-report';

afterEach(() => vi.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('/api/progression-report', () => {
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

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      checkRateLimitMock.mockResolvedValueOnce({ allowed: false, reason: 'rate_limited' });

      const { res, getStatus } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(getStatus()).toBe(429);
    });
  });

  describe('happy path — no API key (fallback narrative)', () => {
    it('returns 200 with a narrative string', async () => {
      const { res, getStatus, getBody } = createMockResponse();
      await handler(makeReq(validBody), res);
      expect(getStatus()).toBe(200);
      expect(typeof getBody().narrative).toBe('string');
      expect((getBody().narrative as string).length).toBeGreaterThan(0);
    });

    it('works with empty topPRs', async () => {
      const { res, getStatus } = createMockResponse();
      await handler(makeReq({ ...validBody, topPRs: [] }), res);
      expect(getStatus()).toBe(200);
    });

    it('works when firstName is absent', async () => {
      const { res, getStatus, getBody } = createMockResponse();
      const bodyNoName = { ...validBody, firstName: undefined };
      await handler(makeReq(bodyNoName as unknown as Record<string, unknown>), res);
      expect(getStatus()).toBe(200);
      expect(typeof getBody().narrative).toBe('string');
    });

    it('narrative is a non-empty string when totalWorkouts is provided', async () => {
      const { res, getBody } = createMockResponse();
      await handler(makeReq(validBody), res);
      const narrative = getBody().narrative as string;
      expect(narrative.length).toBeGreaterThan(10);
    });
  });
});
