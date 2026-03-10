import { afterEach, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit } from './_rateLimit.js';

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader() {
      return;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

describe('checkRateLimit', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('fails closed in production when Upstash config is missing', async () => {
    process.env.VERCEL_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { res, getStatusCode, getBody } = createMockResponse();
    const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as unknown as VercelRequest;

    const allowed = await checkRateLimit(req, res);

    expect(allowed).toBe(false);
    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Rate limiting is not configured' });
  });
});
