import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getPreferencesMap, isPreferredHour } from './_notificationPrefs.js';
import { pickProgressMessages, type SessionRow } from './_progressMilestones.js';
import { sendPushToUser } from './_sendPush.js';

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 365;
const MISSED_DAY_CHECKPOINTS = new Set([2, 3, 7, 14]);
function wholeDaysBetween(laterMs: number, earlierIso: string): number {
  const earlierMs = new Date(earlierIso).getTime();
  if (!Number.isFinite(earlierMs)) return 0;
  return Math.max(0, Math.floor((laterMs - earlierMs) / DAY_MS));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ sent: 0, reason: 'Supabase not configured' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const nowMs = Date.now();
  const recentCutoffIso = new Date(nowMs - DAY_MS).toISOString();
  const lookbackIso = new Date(nowMs - LOOKBACK_DAYS * DAY_MS).toISOString();

  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('user_id');

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  const userIds = [...new Set(subscriptions.map((s) => s.user_id as string))];
  const prefsMap = await getPreferencesMap(supabaseAdmin, userIds);
  const { data: rows } = await supabaseAdmin
    .from('workout_sessions')
    .select('user_id, started_at, total_volume_kg')
    .in('user_id', userIds)
    .gte('started_at', lookbackIso)
    .not('completed_at', 'is', null);

  const sessions = (rows ?? []) as SessionRow[];
  const byUser = new Map<string, SessionRow[]>();

  for (const row of sessions) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
    byUser.get(row.user_id)!.push(row);
  }

  for (const [, userSessions] of byUser.entries()) {
    userSessions.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  }

  let sent = 0;

  await Promise.allSettled(
    userIds.map(async (userId) => {
      const prefs = prefsMap.get(userId);
      if (!prefs || !prefs.push_enabled || !isPreferredHour(prefs)) return;

      const userSessions = byUser.get(userId) ?? [];
      if (userSessions.length === 0) return;

      const recentSessions = userSessions.filter((s) => s.started_at >= recentCutoffIso);

      // Missed-day nudges only fire on specific checkpoints to avoid notification fatigue.
      const lastSession = userSessions[userSessions.length - 1];
      const daysSinceLast = wholeDaysBetween(nowMs, lastSession.started_at);
      if (prefs.missed_day_enabled && recentSessions.length === 0 && MISSED_DAY_CHECKPOINTS.has(daysSinceLast)) {
        await sendPushToUser(userId, {
          title: 'Training Day Check-In',
          body:
            daysSinceLast >= 7
              ? 'It has been a while since your last session. A short workout today can restart your momentum.'
              : 'You are close to breaking your rhythm. Get one session in today and keep the streak alive.',
          url: '/dashboard',
          tag: `missed-day-${daysSinceLast}`,
        });
        sent++;
      }

      const progressMessages = prefs.progress_enabled
        ? pickProgressMessages(userSessions, recentSessions, nowMs)
        : [];
      for (const message of progressMessages) {
        await sendPushToUser(userId, message);
        sent++;
      }
    }),
  );

  return res.status(200).json({ sent, usersEvaluated: userIds.length });
}
