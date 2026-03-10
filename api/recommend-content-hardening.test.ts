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
    body: { query: 'bench press progression', completedLessons: ['lesson_1'], limit: 2 },
    ...overrides,
  } as unknown as VercelRequest;
}

describe('recommend-content hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 500 when OPENAI key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'OPENAI_API_KEY not configured' });
  });

  it('returns 500 when supabase env vars are missing', async () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Supabase env vars not configured' });
  });

  it('filters completed lessons and sorts results by relevance', async () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          { id: 'lesson_1', type: 'lesson', metadata: { title: 'Completed Lesson', courseId: 'course_1' }, similarity: 0.99 },
          { id: 'course_2', type: 'course', metadata: { title: 'Hypertrophy Course', category: 'strength' }, similarity: 0.72 },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { id: 'exercise_1', metadata: { name: 'Incline Bench Press', category: 'chest' }, similarity: 0.83 },
        ],
      });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ rpc }),
    }));

    vi.doMock('openai', () => ({
      default: class MockOpenAI {
        embeddings = {
          create: vi.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })),
        };
      },
    }));

    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({
      recommendations: [
        {
          id: 'exercise_1',
          title: 'Incline Bench Press',
          type: 'exercise',
          category: 'chest',
          relevanceScore: 0.83,
          metadata: { name: 'Incline Bench Press', category: 'chest' },
        },
        {
          id: 'course_2',
          title: 'Hypertrophy Course',
          type: 'course',
          courseId: undefined,
          category: 'strength',
          relevanceScore: 0.72,
          metadata: { title: 'Hypertrophy Course', category: 'strength' },
        },
      ],
      hasContentGap: false,
    });
  });

  it('returns content-gap response when no recommendations are found', async () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ rpc }),
    }));

    vi.doMock('openai', () => ({
      default: class MockOpenAI {
        embeddings = {
          create: vi.fn(async () => ({ data: [{ embedding: [0.1, 0.2] }] })),
        };
      },
    }));

    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq({ body: { query: 'rare topic' } }), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ recommendations: [], hasContentGap: true, gapTopic: 'rare topic' });
  });

  it('returns 500 when embedding generation throws', async () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ rpc: vi.fn() }),
    }));

    vi.doMock('openai', () => ({
      default: class MockOpenAI {
        embeddings = {
          create: vi.fn(async () => {
            throw new Error('embedding service unavailable');
          }),
        };
      },
    }));

    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'embedding service unavailable' });
  });
});
