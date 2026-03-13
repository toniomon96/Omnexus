import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      authorization: 'Bearer test-token',
    },
    socket: { remoteAddress: '127.0.0.1' },
    body: {
      programId: 'prog_1',
      daysPerWeek: 4,
    },
    ...overrides,
  } as unknown as VercelRequest;
}

function createRes() {
  let statusCode = 200;
  let body: unknown = null;

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

describe('/api/generate-missions hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('sanitizes malformed DB progress payload in response mapping', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const createMessage = vi.fn(async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify([
          {
            type: 'consistency',
            description: 'Complete training sessions this month',
            target: { metric: 'sessions', value: 12, unit: 'sessions' },
          },
        ]),
      }],
    }));

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
          select: vi.fn(async () => ({
            data: [{
              id: 'mission_1',
              user_id: 'user_1',
              program_id: 'prog_1',
              type: 'consistency',
              description: 'Complete training sessions this month',
              target: { metric: 'sessions', value: 12, unit: 'sessions' },
              progress: {
                current: Number.POSITIVE_INFINITY,
                history: [
                  { date: '2026-03-01', value: 2 },
                  { date: '', value: 1 },
                  { date: '2026-03-02', value: Number.NaN },
                ],
              },
              status: 'active',
              created_at: '2026-03-01T00:00:00Z',
            }],
            error: null,
          })),
        })),
      })),
    };

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      }
    }));
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: handler } = await import('./generate-missions.js');
    const { res, getStatusCode, getBody } = createRes();

    await handler(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({
      missions: [{
        id: 'mission_1',
        userId: 'user_1',
        programId: 'prog_1',
        type: 'consistency',
        description: 'Complete training sessions this month',
        target: { metric: 'sessions', value: 12, unit: 'sessions' },
        progress: {
          current: 0,
          history: [{ date: '2026-03-01', value: 2 }, { date: '2026-03-02', value: 0 }],
        },
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
      }],
    });
  });
});
