import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader() {
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
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    body: {},
    ...overrides,
  } as unknown as VercelRequest;
}

describe('signin route hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('rejects invalid email format', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const supabaseMock = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })) })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signin } = await import('./signin.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signin(createReq({ body: { email: 'not-an-email', password: 'anything' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Valid email is required' });
  });

  it('locks request when an existing lockout is active', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const maybeSingle = vi.fn(async () => ({
      data: {
        email_hash: 'hash',
        failed_attempts: 5,
        first_failed_at: new Date().toISOString(),
        last_failed_at: new Date().toISOString(),
        locked_until: new Date(Date.now() + 5 * 60_000).toISOString(),
      },
      error: null,
    }));

    const supabaseMock = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { default: signin } = await import('./signin.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signin(createReq({ body: { email: 'user@example.com', password: 'correct horse battery staple' } }), res);

    expect(getStatusCode()).toBe(429);
    expect(getBody()).toEqual({ error: 'Too many failed sign-in attempts. Please try again in 15 minutes.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns access and refresh tokens when credentials are valid', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const upsert = vi.fn(async () => ({ error: null }));
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));

    const supabaseMock = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
        upsert,
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 'at', refresh_token: 'rt' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { default: signin } = await import('./signin.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signin(createReq({ body: { email: 'user@example.com', password: 'correct horse battery staple' } }), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    expect(upsert).toHaveBeenCalled();
  });
});
