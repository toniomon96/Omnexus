import { afterEach, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dailyReminder from './daily-reminder.js';
import trainingNotifications from './training-notifications.js';
import weeklyDigest from './weekly-digest.js';
import generateSharedChallenge from './generate-shared-challenge.js';
import askHandler from './ask.js';
import insightsHandler from './insights.js';

function createMockResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
    end() {
      return res;
    },
    send(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeader: (name: string) => headers.get(name),
  };
}

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as VercelRequest;
}

describe('security route hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects cron calls when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    for (const handler of [dailyReminder, trainingNotifications, weeklyDigest, generateSharedChallenge]) {
      const { res, getStatusCode, getBody } = createMockResponse();
      await handler(createReq({ method: 'GET', headers: { origin: 'http://localhost:3000' } }), res);
      expect(getStatusCode()).toBe(500);
      expect(getBody()).toEqual({ error: 'CRON_SECRET not configured' });
    }
  });

  it('rejects invalid cron authorization', async () => {
    process.env.CRON_SECRET = 'expected-secret';

    for (const handler of [dailyReminder, trainingNotifications, weeklyDigest, generateSharedChallenge]) {
      const { res, getStatusCode, getBody } = createMockResponse();
      await handler(createReq({ method: 'GET', headers: { authorization: 'Bearer wrong', origin: 'http://localhost:3000' } }), res);
      expect(getStatusCode()).toBe(401);
      expect(getBody()).toEqual({ error: 'Unauthorized' });
    }
  });

  it('blocks /api/ask in production when rate-limit config is missing', async () => {
    process.env.VERCEL_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { res, getStatusCode, getBody } = createMockResponse();
    const req = createReq({
      method: 'POST',
      headers: { origin: 'https://omnexus.netlify.app' },
      body: { question: 'How much protein should I eat?' },
    });

    await askHandler(req, res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Rate limiting is not configured' });
  });

  it('requires auth for /api/insights', async () => {
    process.env.NODE_ENV = 'test';

    const { res, getStatusCode, getBody } = createMockResponse();
    const req = createReq({
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: { workoutSummary: 'Session data...' },
    });

    await insightsHandler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('rejects insecure forwarded protocol in production', async () => {
    process.env.VERCEL_ENV = 'production';

    const { res, getStatusCode, getBody } = createMockResponse();
    const req = createReq({
      method: 'POST',
      headers: {
        origin: 'https://omnexus.netlify.app',
        'x-forwarded-proto': 'http',
      },
      body: { question: 'How should I train chest twice weekly?' },
    });

    await askHandler(req, res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'HTTPS is required' });
  });

  it('applies security headers on API responses', async () => {
    process.env.NODE_ENV = 'test';

    const { res, getHeader } = createMockResponse();
    const req = createReq({
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: { question: '' },
    });

    await askHandler(req, res);

    expect(getHeader('X-Content-Type-Options')).toBe('nosniff');
    expect(getHeader('X-Frame-Options')).toBe('DENY');
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(getHeader('Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  });
});
