import type { PushPayload } from './_sendPush.js';
import { sendPushToUserWithResult } from './_sendPush.js';

const MAX_RETRY_ATTEMPTS = 2;

export interface ReliableNotifyOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any;
  userId: string;
  eventType: string;
  dedupeKey: string;
  payload: PushPayload;
  scheduledFor?: string;
  maxAttempts?: number;
}

export interface ReliableNotifyResult {
  status: 'sent' | 'skipped' | 'failed';
  attempts: number;
  reason?: string;
}

function isRetryableStatus(status: number | null): boolean {
  if (status == null) return false;
  return status === 408 || status === 429 || status >= 500;
}

export async function sendNotificationReliably(
  options: ReliableNotifyOptions,
): Promise<ReliableNotifyResult> {
  const {
    supabaseAdmin,
    userId,
    eventType,
    dedupeKey,
    payload,
    scheduledFor = new Date().toISOString(),
    maxAttempts = MAX_RETRY_ATTEMPTS,
  } = options;

  const { error: insertError } = await supabaseAdmin.from('notification_events').insert({
    user_id: userId,
    event_type: eventType,
    dedupe_key: dedupeKey,
    status: 'processing',
    attempts: 0,
    payload,
    scheduled_for: scheduledFor,
  });

  if (insertError && insertError.code === '23505') {
    return { status: 'skipped', attempts: 0, reason: 'deduped' };
  }

  if (insertError) {
    throw new Error(`[sendNotificationReliably] failed to create event row: ${insertError.message}`);
  }

  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;

    const result = await sendPushToUserWithResult(userId, payload);

    if (result.sent > 0) {
      await supabaseAdmin
        .from('notification_events')
        .update({ status: 'sent', attempts, provider_status: 201, error_code: null })
        .eq('dedupe_key', dedupeKey);
      return { status: 'sent', attempts };
    }

    if (!result.hasSubscriptions) {
      await supabaseAdmin
        .from('notification_events')
        .update({ status: 'skipped', attempts, error_code: 'no_subscriptions', provider_status: null })
        .eq('dedupe_key', dedupeKey);
      return { status: 'skipped', attempts, reason: 'no_subscriptions' };
    }

    const retryable = isRetryableStatus(result.lastErrorStatus);
    if (!retryable || attempts >= maxAttempts) {
      await supabaseAdmin
        .from('notification_events')
        .update({
          status: 'failed',
          attempts,
          error_code: result.lastErrorStatus ? `push_${result.lastErrorStatus}` : 'push_failed',
          provider_status: result.lastErrorStatus,
        })
        .eq('dedupe_key', dedupeKey);
      return { status: 'failed', attempts, reason: 'provider_failure' };
    }
  }

  await supabaseAdmin
    .from('notification_events')
    .update({ status: 'failed', attempts, error_code: 'retry_exhausted' })
    .eq('dedupe_key', dedupeKey);

  return { status: 'failed', attempts, reason: 'retry_exhausted' };
}
