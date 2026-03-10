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

describe('input validation guards', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('generate-lesson requires topic', async () => {
    const { default: generateLesson } = await import('./generate-lesson.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateLesson(createReq({ body: {} }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'topic is required' });
  });

  it('generate-lesson rejects oversized topic', async () => {
    const { default: generateLesson } = await import('./generate-lesson.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await generateLesson(createReq({ body: { topic: 'a'.repeat(201) } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'topic too long (max 200 characters)' });
  });

  it('recommend-content requires query', async () => {
    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq({ body: {} }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'query is required' });
  });

  it('recommend-content rejects oversized query', async () => {
    const { default: recommendContent } = await import('./recommend-content.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await recommendContent(createReq({ body: { query: 'q'.repeat(501) } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'query too long (max 500 characters)' });
  });

  it('meal-plan requires macro fields', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const { default: mealPlan } = await import('./meal-plan.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await mealPlan(createReq({ body: { calories: 2200, proteinG: 160 } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'calories, proteinG, carbsG, fatG are required' });
  });

  it('report-bug requires non-empty description', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    };

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabaseMock,
    }));

    const { default: reportBug } = await import('./report-bug.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await reportBug(createReq({ body: { description: '   ' } }), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Description is required' });
  });
});
