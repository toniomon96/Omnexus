import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sendPushToUserWithResult', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns empty result when configuration is missing', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VAPID_EMAIL;
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const { sendPushToUserWithResult } = await import('./_sendPush.js');

    const result = await sendPushToUserWithResult('user_1', {
      title: 'Title',
      body: 'Body',
    });

    expect(result).toEqual({
      hasSubscriptions: false,
      sent: 0,
      failed: 0,
      staleRemoved: 0,
      lastErrorStatus: null,
    });
  });

  it('sends notifications and removes stale subscriptions on 410/404', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.VAPID_EMAIL = 'mailto:test@example.com';
    process.env.VAPID_PUBLIC_KEY = 'pub';
    process.env.VAPID_PRIVATE_KEY = 'priv';

    const setVapidDetails = vi.fn();
    const sendNotification = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ statusCode: 410 });

    const deleteIn = vi.fn(async () => ({ error: null }));
    const deleteEq = vi.fn(() => ({ in: deleteIn }));
    const deleteFn = vi.fn(() => ({ eq: deleteEq }));

    const subs = [
      { endpoint: 'https://push.example/ok', p256dh: 'p1', auth: 'a1' },
      { endpoint: 'https://push.example/stale', p256dh: 'p2', auth: 'a2' },
    ];

    const selectEq = vi.fn(async () => ({ data: subs }));
    const select = vi.fn(() => ({ eq: selectEq }));

    const from = vi.fn(() => ({
      select,
      delete: deleteFn,
    }));

    vi.doMock('web-push', () => ({
      default: {
        setVapidDetails,
        sendNotification,
      },
    }));

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({ from })),
    }));

    const { sendPushToUserWithResult } = await import('./_sendPush.js');

    const result = await sendPushToUserWithResult('user_1', {
      title: 'Weekly Digest',
      body: 'Keep momentum',
      tag: 'weekly-digest',
    });

    expect(setVapidDetails).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(deleteIn).toHaveBeenCalledWith('endpoint', ['https://push.example/stale']);
    expect(result).toEqual({
      hasSubscriptions: true,
      sent: 1,
      failed: 1,
      staleRemoved: 1,
      lastErrorStatus: 410,
    });
  });
});
