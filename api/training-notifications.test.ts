import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

function createReq(authorization?: string): VercelRequest {
  return {
    method: 'GET',
    headers: authorization ? { authorization } : {},
  } as unknown as VercelRequest;
}

interface SessionRow {
  user_id: string;
  started_at: string;
  total_volume_kg: number | null;
}

function mockSupabase(subscriptions: Array<{ user_id: string }>, sessions: SessionRow[]) {
  const preferenceRows = subscriptions.map((s) => ({
    user_id: s.user_id,
    push_enabled: true,
    training_reminders_enabled: true,
    missed_day_enabled: true,
    community_enabled: true,
    progress_enabled: true,
    preferred_hour_local: 17,
    timezone: 'UTC',
  }));

  const from = vi.fn((table: string) => {
    if (table === 'push_subscriptions') {
      return {
        select: vi.fn(async () => ({ data: subscriptions, error: null })),
      };
    }

    if (table === 'workout_sessions') {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            gte: vi.fn(() => ({
              not: vi.fn(async () => ({ data: sessions, error: null })),
            })),
          })),
        })),
      };
    }

    if (table === 'notification_preferences') {
      return {
        select: vi.fn(() => ({
          in: vi.fn(async () => ({ data: preferenceRows, error: null })),
        })),
      };
    }

    return {
      select: vi.fn(async () => ({ data: [], error: null })),
    };
  });

  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({ from }),
  }));
}

describe('training-notifications', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T17:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 500 when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const { default: handler } = await import('./training-notifications.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq('Bearer whatever'), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'CRON_SECRET not configured' });
  });

  it('returns 401 for invalid cron authorization', async () => {
    process.env.CRON_SECRET = 'expected-secret';

    const { default: handler } = await import('./training-notifications.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq('Bearer wrong-secret'), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Unauthorized' });
  });

  it('sends missed-day checkpoint reminder when user has not trained for 2 days', async () => {
    process.env.CRON_SECRET = 'expected-secret';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const sendPushToUser = vi.fn(async () => {});
    vi.doMock('./_sendPush.js', () => ({ sendPushToUser }));

    const now = Date.now();
    mockSupabase(
      [{ user_id: 'user-1' }],
      [
        {
          user_id: 'user-1',
          started_at: new Date(now - 2 * 86_400_000 - 5_000).toISOString(),
          total_volume_kg: 1200,
        },
      ],
    );

    const { default: handler } = await import('./training-notifications.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq('Bearer expected-secret'), res);

    expect(getStatusCode()).toBe(200);
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: 'Training Day Check-In',
        tag: 'missed-day-2',
      }),
    );
    expect(getBody()).toEqual({ sent: 1, usersEvaluated: 1 });
  });

  it('sends session and volume milestones when crossed in the last day', async () => {
    process.env.CRON_SECRET = 'expected-secret';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const sendPushToUser = vi.fn(async () => {});
    vi.doMock('./_sendPush.js', () => ({ sendPushToUser }));

    const now = Date.now();
    const sessions: SessionRow[] = [];

    for (let i = 0; i < 9; i++) {
      sessions.push({
        user_id: 'user-1',
        started_at: new Date(now - (i + 2) * 2 * 86_400_000).toISOString(),
        total_volume_kg: 1088,
      });
    }

    sessions.push({
      user_id: 'user-1',
      started_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      total_volume_kg: 308,
    });

    mockSupabase([{ user_id: 'user-1' }], sessions);

    const { default: handler } = await import('./training-notifications.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createReq('Bearer expected-secret'), res);

    expect(getStatusCode()).toBe(200);
    expect(sendPushToUser).toHaveBeenCalledTimes(2);
    expect(sendPushToUser).toHaveBeenNthCalledWith(
      1,
      'user-1',
      expect.objectContaining({ title: 'Milestone Unlocked', tag: 'milestone-sessions' }),
    );
    expect(sendPushToUser).toHaveBeenNthCalledWith(
      2,
      'user-1',
      expect.objectContaining({ title: 'Volume Milestone', tag: 'milestone-volume' }),
    );
    expect(getBody()).toEqual({ sent: 2, usersEvaluated: 1 });
  });
});
