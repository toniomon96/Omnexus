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
    query: {},
    ...overrides,
  } as unknown as VercelRequest;
}

describe('account route validation guards', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('setup-profile rejects missing required fields', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        admin: {
          getUserById: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
        },
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(createReq({ body: { userId: 'user_1' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Missing required fields' });
  });

  it('setup-profile rejects invalid goal enum', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        admin: {
          getUserById: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
        },
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(
      createReq({
        body: {
          userId: 'user_1',
          name: 'Tester',
          goal: 'powerlifting',
          experienceLevel: 'beginner',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'goal must be one of: hypertrophy, fat-loss, general-fitness' });
  });

  it('setup-profile rejects invalid experienceLevel enum', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        admin: {
          getUserById: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
        },
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(
      createReq({
        body: {
          userId: 'user_1',
          name: 'Tester',
          goal: 'hypertrophy',
          experienceLevel: 'expert',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'experienceLevel must be one of: beginner, intermediate, advanced' });
  });

  it('signup rejects invalid email format', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        admin: {
          createUser: vi.fn(),
          generateLink: vi.fn(),
        },
      },
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signup } = await import('./signup.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signup(createReq({ body: { email: 'not-an-email', password: 'password123' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Valid email is required' });
  });

  it('signup rejects short password', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        admin: {
          createUser: vi.fn(),
          generateLink: vi.fn(),
        },
      },
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signup } = await import('./signup.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signup(createReq({ body: { email: 'test@example.com', password: '123' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Password must be at least 12 characters' });
  });

  it('checkout-status requires session_id query parameter', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
      },
      from: vi.fn(() => ({
        update: vi.fn(() => ({ eq: vi.fn(async () => ({ data: null, error: null })) })),
        upsert: vi.fn(async () => ({ data: null, error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: { sessions: { retrieve: vi.fn() } },
          subscriptions: { retrieve: vi.fn() },
        },
      }),
    }));

    const { default: checkoutStatus } = await import('./checkout-status.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(
      createReq({
        method: 'GET',
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
        query: {},
      }),
      res,
    );

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'session_id is required' });
  });

  it('setup-profile rejects bearer token that does not match requested userId', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'other_user' } }, error: null })),
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(
      createReq({
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
        body: {
          userId: 'user_1',
          name: 'Tester',
          goal: 'hypertrophy',
          experienceLevel: 'beginner',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(403);
    expect(getBody()).toEqual({ error: 'Token user does not match userId' });
  });

  it('setup-profile treats duplicate profile insert as success', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: { code: '23505' } })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(
      createReq({
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
        body: {
          userId: 'user_1',
          name: 'Tester',
          goal: 'hypertrophy',
          experienceLevel: 'beginner',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ ok: true });
  });

  it('setup-profile maps FK violation to user not found', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: { code: '23503' } })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: setupProfile } = await import('./setup-profile.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await setupProfile(
      createReq({
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
        body: {
          userId: 'user_1',
          name: 'Tester',
          goal: 'hypertrophy',
          experienceLevel: 'beginner',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'User not found' });
  });

  it('signup returns 409 for duplicate account attempts', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        admin: {
          createUser: vi.fn(async () => ({ data: null, error: { message: 'User already registered' } })),
          generateLink: vi.fn(),
        },
      },
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signup } = await import('./signup.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signup(createReq({ body: { email: 'test@example.com', password: 'password1234' } }), res);

    expect(getStatusCode()).toBe(409);
    expect(getBody()).toEqual({ error: 'An account with this email already exists. Please sign in instead.' });
  });

  it('signup returns 500 when user creation fails for non-duplicate error', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        admin: {
          createUser: vi.fn(async () => ({ data: null, error: { message: 'internal create failure' } })),
          generateLink: vi.fn(),
        },
      },
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signup } = await import('./signup.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signup(createReq({ body: { email: 'test@example.com', password: 'password1234' } }), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Account creation failed. Please try again.' });
  });

  it('signup returns emailSent false when confirmation link generation fails', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        admin: {
          createUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
          generateLink: vi.fn(async () => ({ data: null, error: { message: 'link failed' } })),
        },
      },
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: signup } = await import('./signup.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await signup(createReq({ body: { email: 'test@example.com', password: 'password1234' } }), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ userId: 'user_1', emailSent: false });
  });
});
