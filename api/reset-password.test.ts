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

describe('reset-password route', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('validates email input', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ auth: { admin: { generateLink: vi.fn() } } }),
    }));

    const { default: handler } = await import('./reset-password.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq({ body: { email: 'invalid' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Valid email is required' });
  });

  it('returns generic success when link generation fails', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const generateLink = vi.fn(async () => ({ data: null, error: { message: 'not found' } }));

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ auth: { admin: { generateLink } } }),
    }));

    const { default: handler } = await import('./reset-password.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq({ body: { email: 'user@example.com' } }), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ sent: true });
  });

  it('sends branded email when reset link is generated and Resend is configured', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.RESEND_API_KEY = 're_test';

    const generateLink = vi.fn(async () => ({
      data: { properties: { action_link: 'https://example.com/recovery-link' } },
      error: null,
    }));

    const send = vi.fn(async () => ({ error: null }));

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ auth: { admin: { generateLink } } }),
    }));
    vi.doMock('resend', () => ({
      Resend: class {
        emails = { send };
      },
    }));

    const { default: handler } = await import('./reset-password.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq({ body: { email: 'user@example.com' } }), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ sent: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Reset your Omnexus password',
      }),
    );
  });
});
