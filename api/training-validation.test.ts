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
    headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
    socket: { remoteAddress: '127.0.0.1' },
    body: {},
    ...overrides,
  } as unknown as VercelRequest;
}

function mockAuthenticatedSupabase() {
  const supabaseMock = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
  };

  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => supabaseMock,
  }));

  return supabaseMock;
}

function mockInvalidTokenSupabase() {
  const supabaseMock = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: new Error('invalid token') })),
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
  };

  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => supabaseMock,
  }));

  return supabaseMock;
}

describe('training route validation guards', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('adapt requires exerciseSets array', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockAuthenticatedSupabase();

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq({ body: {} }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'exerciseSets are required' });
  });

  it('adapt rejects too many exercises', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockAuthenticatedSupabase();

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    const exerciseSets = Array.from({ length: 21 }, (_, i) => ({
      exerciseId: `ex-${i}`,
      exerciseName: `Exercise ${i}`,
      sets: [],
    }));

    await adapt(createReq({ body: { exerciseSets } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Too many exercises — maximum 20' });
  });

  it('adapt rejects invalid exercise shape', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockAuthenticatedSupabase();

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(
      createReq({
        body: {
          exerciseSets: [{ exerciseId: 123, exerciseName: 'Bench', sets: [] }],
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Invalid exerciseSets format' });
  });

  it('generate-missions requires programId', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockAuthenticatedSupabase();

    const { default: generateMissions } = await import('./generate-missions.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateMissions(createReq({ body: {} }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'programId is required' });
  });

  it('adapt rejects missing bearer auth', async () => {
    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq({ headers: { origin: 'http://localhost:3000' }, body: { exerciseSets: [] } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('adapt rejects invalid bearer token', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockInvalidTokenSupabase();

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(
      createReq({
        body: {
          exerciseSets: [{ exerciseId: 'ex-1', exerciseName: 'Bench', sets: [] }],
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Invalid token' });
  });

  it('generate-missions rejects invalid bearer token', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    mockInvalidTokenSupabase();

    const { default: generateMissions } = await import('./generate-missions.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateMissions(createReq({ body: { programId: 'prog_1' } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Invalid token' });
  });

  it('generate-missions returns 500 when DB insert fails after mission generation fallback', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
      },
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(async () => ({ data: null, error: { message: 'insert failed' } })),
        })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn(async () => {
            throw new Error('claude unavailable');
          }),
        };
      },
    }));

    const { default: generateMissions } = await import('./generate-missions.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateMissions(
      createReq({
        body: {
          programId: 'prog_1',
          programName: 'Strength Block',
          goal: 'hypertrophy',
          experienceLevel: 'intermediate',
          daysPerWeek: 4,
          durationWeeks: 8,
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Failed to save missions' });
  });
});
