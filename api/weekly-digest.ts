import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { canSendNotificationNow, getPreferencesMap, isPreferredHour } from './_notificationPrefs.js';
import { sendNotificationReliably } from './_notify.js';

const DIGEST_PROMPT = `You are a supportive fitness coach. Based on a user's workout data from the past week, write exactly 2 sentences:
1. A data-driven observation about their volume trend compared to the prior week, or their consistency.
2. One specific, actionable recommendation for the coming week.

Be encouraging, specific, and concise. Do not add any other text, headers, or disclaimers.`;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ sent: 0, reason: 'Anthropic not configured' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Find users active in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const { data: activeSessions } = await supabaseAdmin
    .from('workout_sessions')
    .select('user_id, total_volume_kg, started_at')
    .gte('started_at', twoWeeksAgo)
    .not('completed_at', 'is', null);

  if (!activeSessions || activeSessions.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  // Group by user, split into this week vs last week
  const userMap: Record<string, { thisWeek: number; lastWeek: number; count: number }> = {};
  for (const s of activeSessions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = s as any;
    if (!userMap[row.user_id]) {
      userMap[row.user_id] = { thisWeek: 0, lastWeek: 0, count: 0 };
    }
    const vol = row.total_volume_kg ?? 0;
    if (row.started_at >= sevenDaysAgo) {
      userMap[row.user_id].thisWeek += vol;
      userMap[row.user_id].count++;
    } else {
      userMap[row.user_id].lastWeek += vol;
    }
  }

  // Only digest users who trained this week
  const activeUserIds = Object.keys(userMap).filter(
    (id) => userMap[id].thisWeek > 0,
  );

  if (activeUserIds.length === 0) return res.status(200).json({ sent: 0 });

  const prefsMap = await getPreferencesMap(supabaseAdmin, activeUserIds);

  let sent = 0;
  const weekKey = `${new Date().getUTCFullYear()}-W${Math.ceil((Date.now() / 86_400_000) / 7)}`;

  await Promise.allSettled(
    activeUserIds.map(async (userId) => {
      const prefs = prefsMap.get(userId);
      if (!prefs || !prefs.push_enabled || !prefs.progress_enabled || !isPreferredHour(prefs) || !canSendNotificationNow(prefs)) {
        return;
      }

      const { thisWeek, lastWeek, count } = userMap[userId];
      const trend =
        lastWeek === 0
          ? 'no data for last week'
          : `${lastWeek.toFixed(0)} kg last week → ${thisWeek.toFixed(0)} kg this week`;

      const userMessage = `Sessions this week: ${count}\nVolume: ${trend}`;

      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          system: DIGEST_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        const block = msg.content[0];
        if (block.type !== 'text') return;

        const body = block.text.trim();
        const result = await sendNotificationReliably({
          supabaseAdmin,
          userId,
          eventType: 'weekly_digest',
          dedupeKey: `weekly-digest:${userId}:${weekKey}`,
          payload: {
            title: 'Weekly Fitness Digest',
            body: body.slice(0, 100) + (body.length > 100 ? '…' : ''),
            url: '/insights',
            tag: 'weekly-digest',
          },
        });
        if (result.status === 'sent') sent++;
      } catch (err) {
        console.error(`[weekly-digest] Failed for user ${userId}:`, err);
      }
    }),
  );

  return res.status(200).json({ sent });
}
