import { afterEach, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_cors.js';

function createMockResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
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

describe('setCorsHeaders', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects missing origin in production', () => {
    process.env.NODE_ENV = 'production';
    const { res, getStatusCode, getBody } = createMockResponse();
    const req = { headers: {} } as VercelRequest;

    const ok = setCorsHeaders(req, res);

    expect(ok).toBe(false);
    expect(getStatusCode()).toBe(403);
    expect(getBody()).toEqual({ error: 'Origin not allowed' });
  });

  it('rejects disallowed origin in production', () => {
    process.env.NODE_ENV = 'production';
    const { res, getStatusCode } = createMockResponse();
    const req = { headers: { origin: 'https://evil.example.com' } } as unknown as VercelRequest;

    const ok = setCorsHeaders(req, res);

    expect(ok).toBe(false);
    expect(getStatusCode()).toBe(403);
  });

  it('allows configured production origins', () => {
    process.env.NODE_ENV = 'production';
    const { res, getHeader } = createMockResponse();
    const req = { headers: { origin: 'https://omnexus.netlify.app' } } as unknown as VercelRequest;

    const ok = setCorsHeaders(req, res);

    expect(ok).toBe(true);
    expect(getHeader('Access-Control-Allow-Origin')).toBe('https://omnexus.netlify.app');
  });

  it('allows ALLOWED_ORIGIN from env in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGIN = 'https://omnexus.fit';

    const { res, getHeader } = createMockResponse();
    const req = { headers: { origin: 'https://omnexus.fit' } } as unknown as VercelRequest;

    const ok = setCorsHeaders(req, res);

    expect(ok).toBe(true);
    expect(getHeader('Access-Control-Allow-Origin')).toBe('https://omnexus.fit');
  });

  it('allows APP_URL origin in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_URL = 'https://app.omnexus.fit/some/path';

    const { res, getHeader } = createMockResponse();
    const req = { headers: { origin: 'https://app.omnexus.fit' } } as unknown as VercelRequest;

    const ok = setCorsHeaders(req, res);

    expect(ok).toBe(true);
    expect(getHeader('Access-Control-Allow-Origin')).toBe('https://app.omnexus.fit');
  });
});
