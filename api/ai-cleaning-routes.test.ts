import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    body: {},
    ...overrides,
  } as unknown as VercelRequest;
}

function createRes() {
  let statusCode = 200;
  let jsonBody: unknown = null;

  const res = {
    setHeader() {
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
    end() {
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
  };
}

describe('AI route response cleaning', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('cleans markdown/prefix artifacts from /api/insights output', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const createMessage = vi.fn(async () => ({
      content: [{ type: 'text', text: '```markdown\nAssistant: **Training Overview**\n\nSolid week.\n```' }],
    }));

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      },
    }));
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
        },
      }),
    }));

    const { default: insightsHandler } = await import('./insights.js');
    const { res, getStatusCode, getJsonBody } = createRes();

    await insightsHandler(
      createReq({
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer token' },
        body: { userGoal: 'hypertrophy', userExperience: 'beginner', workoutSummary: 'session summary' },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getJsonBody()).toEqual({ insight: '**Training Overview**\n\nSolid week.' });
  });

  it('cleans markdown/prefix artifacts from /api/briefing output', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const createMessage = vi.fn(async () => ({
      content: [{ type: 'text', text: '```markdown\nAI: Warm up first, then push top sets.\n```' }],
    }));

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      },
    }));

    const { default: briefingHandler } = await import('./briefing.js');
    const { res, getStatusCode, getJsonBody } = createRes();

    await briefingHandler(
      createReq({
        body: {
          exerciseNames: ['Bench Press'],
          recentHistory: [],
          userContext: { goal: 'hypertrophy', experienceLevel: 'beginner' },
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getJsonBody()).toEqual({ briefing: 'Warm up first, then push top sets.' });
  });

  it('cleans onboarding display reply while preserving profile parsing', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const createMessage = vi.fn(async () => ({
      content: [{
        type: 'text',
        text: [
          'Assistant: Great, we have enough to build your plan.',
          '[PROFILE_COMPLETE]',
          '{"goals":["general-fitness"],"trainingAgeYears":0,"daysPerWeek":3,"sessionDurationMinutes":45,"equipment":["bodyweight"],"injuries":[],"priorityMuscles":["legs"],"programStyle":"any","includeCardio":true,"aiSummary":"Solid beginner setup."}',
        ].join('\n'),
      }],
    }));

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      },
    }));

    const { default: onboardHandler } = await import('./onboard.js');
    const { res, getStatusCode, getJsonBody } = createRes();

    await onboardHandler(
      createReq({
        body: {
          messages: [{ role: 'user', content: 'done' }],
          userName: 'Tester',
        },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getJsonBody()).toMatchObject({
      reply: 'Great, we have enough to build your plan.',
      profileComplete: true,
      profile: {
        goals: ['general-fitness'],
        daysPerWeek: 3,
        includeCardio: true,
      },
    });
  });

  it('cleans peer insights narrative text before response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const createMessage = vi.fn(async () => ({
      content: [{ type: 'text', text: '```markdown\nAI: You are training consistently.\n```' }],
    }));

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      },
    }));
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: 'user_1' } }, error: null })),
        },
        from: vi.fn((table: string) => {
          if (table === 'training_profiles') {
            return {
              select: vi.fn(() => ({
                neq: vi.fn(() => ({
                  contains: vi.fn(async () => ({ data: [{ user_id: 'p1' }, { user_id: 'p2' }, { user_id: 'p3' }] })),
                })),
              })),
            };
          }
          if (table === 'workout_sessions') {
            return {
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    not: vi.fn(async () => ({
                      data: [
                        { user_id: 'p1', total_volume_kg: 1000, started_at: new Date().toISOString() },
                        { user_id: 'p2', total_volume_kg: 900, started_at: new Date().toISOString() },
                        { user_id: 'p3', total_volume_kg: 1100, started_at: new Date().toISOString() },
                      ],
                    })),
                  })),
                })),
              })),
            };
          }
          return { select: vi.fn(async () => ({ data: [] })) };
        }),
      }),
    }));

    const { default: peerInsightsHandler } = await import('./peer-insights.js');
    const { res, getStatusCode, getJsonBody } = createRes();

    await peerInsightsHandler(
      createReq({
        headers: { origin: 'http://localhost:3000', authorization: 'Bearer token' },
        body: { goal: 'hypertrophy', experienceLevel: 'beginner' },
      }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getJsonBody()).toMatchObject({ narrative: 'You are training consistently.', hasEnoughPeers: true });
  });

  it('cleans weekly digest message text before push payload', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const createMessage = vi.fn(async () => ({
      content: [{ type: 'text', text: '```markdown\nAssistant: Great volume trend this week. Keep momentum next week.\n```' }],
    }));
    const sendNotificationReliably = vi.fn(async () => ({ status: 'sent' }));

    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: createMessage };
      },
    }));
    vi.doMock('./_notificationPrefs.js', () => ({
      getPreferencesMap: vi.fn(async () => new Map([
        ['user_1', { push_enabled: true, progress_enabled: true, preferred_hour_local: null, timezone: 'UTC' }],
      ])),
      canSendNotificationNow: vi.fn(() => true),
      isPreferredHour: vi.fn(() => true),
    }));
    vi.doMock('./_notify.js', () => ({
      sendNotificationReliably,
    }));
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        from: vi.fn((table: string) => {
          if (table === 'workout_sessions') {
            return {
              select: vi.fn(() => ({
                gte: vi.fn(() => ({
                  not: vi.fn(async () => ({
                    data: [
                      { user_id: 'user_1', total_volume_kg: 1200, started_at: new Date().toISOString(), completed_at: new Date().toISOString() },
                    ],
                  })),
                })),
              })),
            };
          }
          return { select: vi.fn(async () => ({ data: [] })) };
        }),
      }),
    }));

    const { default: weeklyDigestHandler } = await import('./weekly-digest.js');
    const { res, getStatusCode } = createRes();

    await weeklyDigestHandler(
      createReq({ headers: { authorization: 'Bearer cron-secret' } }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(sendNotificationReliably).toHaveBeenCalledTimes(1);
    const calls = sendNotificationReliably.mock.calls as unknown[][];
    const firstCall = calls[0]?.[0] as {
      payload: { body: string };
    };
    expect(firstCall).toBeTruthy();
    expect(firstCall.payload.body).toContain('Great volume trend this week. Keep momentum next week.');
    expect(firstCall.payload.body).not.toContain('Assistant:');
    expect(firstCall.payload.body).not.toContain('```');
  });
});
