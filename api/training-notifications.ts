import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from './_sendPush.js';

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 365;
const MISSED_DAY_CHECKPOINTS = new Set([2, 3, 7, 14]);
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

interface SessionRow {
  user_id: string;
  started_at: string;
  total_volume_kg: number | null;
}

function toUtcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function wholeDaysBetween(laterMs: number, earlierIso: string): number {
  const earlierMs = new Date(earlierIso).getTime();
  if (!Number.isFinite(earlierMs)) return 0;
  return Math.max(0, Math.floor((laterMs - earlierMs) / DAY_MS));
}

function calculateCurrentStreak(sortedAsc: SessionRow[]): number {
  const uniqueDays = new Set(sortedAsc.map((s) => toUtcDayKey(s.started_at)));
  const date = new Date();

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = date.toISOString().slice(0, 10);
    if (uniqueDays.has(key)) {
      streak++;
    } else {
      // Allow streaks ending yesterday so today's pending workout does not break it.
      if (i === 0) {
        date.setUTCDate(date.getUTCDate() - 1);
        continue;
      }
      break;
    }
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return streak;
}

function pickProgressMessages(
  userSessions: SessionRow[],
  recentSessions: SessionRow[],
  nowMs: number,
): Array<{ title: string; body: string; url: string; tag: string }> {
  const messages: Array<{ title: string; body: string; url: string; tag: string }> = [];
  if (userSessions.length === 0 || recentSessions.length === 0) return messages;

  const totalSessions = userSessions.length;
  const totalVolume = userSessions.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
  const recentVolume = recentSessions.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
  const previousVolume = Math.max(0, totalVolume - recentVolume);

  if (totalSessions % 10 === 0) {
    messages.push({
      title: 'Milestone Unlocked',
      body: `You just hit ${totalSessions} completed sessions. Keep building momentum.`,
      url: '/history',
      tag: 'milestone-sessions',
    });
  }

  const prevVolumeTier = Math.floor(previousVolume / 10_000);
  const currentVolumeTier = Math.floor(totalVolume / 10_000);
  if (currentVolumeTier > prevVolumeTier && currentVolumeTier > 0) {
    const tonnage = currentVolumeTier * 10_000;
    messages.push({
      title: 'Volume Milestone',
      body: `You crossed ${tonnage.toLocaleString()} kg of total logged volume.`,
      url: '/insights',
      tag: 'milestone-volume',
    });
  }

  const currentStreak = calculateCurrentStreak(userSessions);
  const trainedInLastDay = recentSessions.some((s) => nowMs - new Date(s.started_at).getTime() <= DAY_MS);
  if (trainedInLastDay && STREAK_MILESTONES.has(currentStreak)) {
    messages.push({
      title: 'Streak Milestone',
      body: `${currentStreak}-day training streak. You are on a roll.`,
      url: '/dashboard',
      tag: 'milestone-streak',
    });
  }

  return messages;
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
      const userSessions = byUser.get(userId) ?? [];
      if (userSessions.length === 0) return;

      const recentSessions = userSessions.filter((s) => s.started_at >= recentCutoffIso);

      // Missed-day nudges only fire on specific checkpoints to avoid notification fatigue.
      const lastSession = userSessions[userSessions.length - 1];
      const daysSinceLast = wholeDaysBetween(nowMs, lastSession.started_at);
      if (recentSessions.length === 0 && MISSED_DAY_CHECKPOINTS.has(daysSinceLast)) {
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

      const progressMessages = pickProgressMessages(userSessions, recentSessions, nowMs);
      for (const message of progressMessages) {
        await sendPushToUser(userId, message);
        sent++;
      }
    }),
  );

  return res.status(200).json({ sent, usersEvaluated: userIds.length });
}
