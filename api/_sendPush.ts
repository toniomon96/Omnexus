import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushSendResult {
  hasSubscriptions: boolean;
  sent: number;
  failed: number;
  staleRemoved: number;
  lastErrorStatus: number | null;
}

// Lazy-init so missing env vars don't crash module load
let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const email = process.env.VAPID_EMAIL;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!email || !pub || !priv) return false;
  webpush.setVapidDetails(email, pub, priv);
  vapidReady = true;
  return true;
}

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function sendPushToUserWithResult(userId: string, payload: PushPayload): Promise<PushSendResult> {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin || !ensureVapid()) {
    return {
      hasSubscriptions: false,
      sent: 0,
      failed: 0,
      staleRemoved: 0,
      lastErrorStatus: null,
    };
  }

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) {
    return {
      hasSubscriptions: false,
      sent: 0,
      failed: 0,
      staleRemoved: 0,
      lastErrorStatus: null,
    };
  }

  const stale: string[] = [];
  let sent = 0;
  let failed = 0;
  let lastErrorStatus: number | null = null;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err: unknown) {
        failed += 1;
        const status = (err as { statusCode?: number }).statusCode;
        lastErrorStatus = typeof status === 'number' ? status : lastErrorStatus;
        if (status === 410 || status === 404) {
          stale.push(sub.endpoint);
        }
      }
    }),
  );

  // Remove expired subscriptions
  if (stale.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .in('endpoint', stale);
  }

  return {
    hasSubscriptions: true,
    sent,
    failed,
    staleRemoved: stale.length,
    lastErrorStatus,
  };
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  await sendPushToUserWithResult(userId, payload);
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}
