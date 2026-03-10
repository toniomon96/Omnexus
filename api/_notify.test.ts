import { afterEach, describe, expect, it, vi } from 'vitest';

function createSupabaseMock(insertError: { code?: string; message?: string } | null = null) {
  const updateEq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const insert = vi.fn(async () => ({ error: insertError }));

  const from = vi.fn((table: string) => {
    if (table !== 'notification_events') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      insert,
      update,
    };
  });

  return {
    supabaseAdmin: { from },
    from,
    insert,
    update,
    updateEq,
  };
}

describe('sendNotificationReliably', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns skipped when dedupe key already exists', async () => {
    const db = createSupabaseMock({ code: '23505', message: 'duplicate key value violates unique constraint' });
    vi.doMock('./_sendPush.js', () => ({
      sendPushToUserWithResult: vi.fn(async () => ({
        hasSubscriptions: true,
        sent: 1,
        failed: 0,
        staleRemoved: 0,
        lastErrorStatus: null,
      })),
    }));

    const { sendNotificationReliably } = await import('./_notify.js');
    const result = await sendNotificationReliably({
      supabaseAdmin: db.supabaseAdmin,
      userId: 'user-1',
      eventType: 'daily_reminder',
      dedupeKey: 'daily-reminder:user-1:2026-03-10',
      payload: { title: 'Daily Reminder', body: 'Keep going' },
    });

    expect(result).toEqual({ status: 'skipped', attempts: 0, reason: 'deduped' });
  });

  it('marks event as sent when push provider succeeds', async () => {
    const db = createSupabaseMock();
    const sendPushToUserWithResult = vi.fn(async () => ({
      hasSubscriptions: true,
      sent: 1,
      failed: 0,
      staleRemoved: 0,
      lastErrorStatus: null,
    }));

    vi.doMock('./_sendPush.js', () => ({ sendPushToUserWithResult }));

    const { sendNotificationReliably } = await import('./_notify.js');
    const result = await sendNotificationReliably({
      supabaseAdmin: db.supabaseAdmin,
      userId: 'user-1',
      eventType: 'progress_milestone',
      dedupeKey: 'progress:user-1:milestone-volume:2026-03-10',
      payload: { title: 'Volume Milestone', body: 'Great work', tag: 'milestone-volume' },
    });

    expect(result).toEqual({ status: 'sent', attempts: 1 });
    expect(sendPushToUserWithResult).toHaveBeenCalledTimes(1);
    expect(db.updateEq).toHaveBeenCalledWith('dedupe_key', 'progress:user-1:milestone-volume:2026-03-10');
  });

  it('retries once on retryable failure and then marks failed', async () => {
    const db = createSupabaseMock();
    const sendPushToUserWithResult = vi
      .fn()
      .mockResolvedValueOnce({
        hasSubscriptions: true,
        sent: 0,
        failed: 1,
        staleRemoved: 0,
        lastErrorStatus: 503,
      })
      .mockResolvedValueOnce({
        hasSubscriptions: true,
        sent: 0,
        failed: 1,
        staleRemoved: 0,
        lastErrorStatus: 503,
      });

    vi.doMock('./_sendPush.js', () => ({ sendPushToUserWithResult }));

    const { sendNotificationReliably } = await import('./_notify.js');
    const result = await sendNotificationReliably({
      supabaseAdmin: db.supabaseAdmin,
      userId: 'user-1',
      eventType: 'friend_activity',
      dedupeKey: 'friend-workout:actor-1:user-1:2026-03-10',
      payload: { title: 'Friend Activity', body: 'A friend completed a workout' },
    });

    expect(result).toEqual({ status: 'failed', attempts: 2, reason: 'provider_failure' });
    expect(sendPushToUserWithResult).toHaveBeenCalledTimes(2);
  });
});
