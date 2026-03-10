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
    body: {
      sessionId: 'sess_1',
      exerciseSets: [
        {
          exerciseId: 'ex_1',
          exerciseName: 'Bench Press',
          sets: [{ setNumber: 1, weight: 100, reps: 8, completed: true, rpe: 8, timestamp: '2026-03-10T00:00:00.000Z' }],
        },
      ],
    },
    ...overrides,
  } as unknown as VercelRequest;
}

function createSupabaseMock(options: { authInvalid?: boolean; sessions?: unknown[] } = {}) {
  const sessions = options.sessions ?? [];

  const supabaseMock = {
    auth: {
      getUser: vi.fn(async () => {
        if (options.authInvalid) {
          return { data: { user: null }, error: new Error('invalid token') };
        }
        return { data: { user: { id: 'user_1' } }, error: null };
      }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'workout_sessions') {
        return {};
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              not: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({ data: sessions, error: null })),
                })),
              })),
            })),
          })),
        })),
      };
    }),
  };

  return supabaseMock;
}

describe('adapt hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 500 when database env vars are missing', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Database not configured' });
  });

  it('returns 500 when AI key is missing', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    delete process.env.ANTHROPIC_API_KEY;

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const supabaseMock = createSupabaseMock();
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'AI service not configured' });
  });

  it('returns no-analysis summary when all sets are incomplete', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const supabaseMock = createSupabaseMock();
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(
      createReq({
        body: {
          exerciseSets: [
            { exerciseId: 'ex_1', exerciseName: 'Bench Press', sets: [{ setNumber: 1, weight: 100, reps: 8, completed: false, timestamp: '2026-03-10T00:00:00.000Z' }] },
          ],
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ adaptations: [], summary: 'No completed sets to analyze.' });
  });

  it('falls back safely when anthropic response shape is invalid', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const supabaseMock = createSupabaseMock({ sessions: [{ id: 'old_1', started_at: '2026-03-01T00:00:00.000Z', exercises: [] }] });
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));

    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn(async () => ({ content: [{ type: 'text', text: '{"bad":true}' }] })),
        };
      },
    }));

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({
      adaptations: [],
      summary: 'Great session! Keep progressive overload in mind for your next workout.',
    });
  });

  it('returns parsed adaptation payload on valid anthropic response', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const supabaseMock = createSupabaseMock();
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));

    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn(async () => ({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  adaptations: [
                    {
                      exerciseId: 'ex_1',
                      exerciseName: 'Bench Press',
                      action: 'increase_weight',
                      suggestion: 'Add 2.5 kg next session',
                      confidence: 'high',
                    },
                  ],
                  summary: 'Strong performance. Increase load next week.',
                }),
              },
            ],
          })),
        };
      },
    }));

    const { default: adapt } = await import('./adapt.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await adapt(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({
      adaptations: [
        {
          exerciseId: 'ex_1',
          exerciseName: 'Bench Press',
          action: 'increase_weight',
          suggestion: 'Add 2.5 kg next session',
          confidence: 'high',
        },
      ],
      summary: 'Strong performance. Increase load next week.',
    });
  });
});
