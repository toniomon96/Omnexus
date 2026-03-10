import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getPreferencesMap, isPreferredHour } from './_notificationPrefs.js';
import { sendPushToUser } from './_sendPush.js';

const MESSAGES = [
  "Time to hit the gym! Your future self will thank you 🏋️",
  "Consistency beats perfection. Show up today 💪",
  "Every rep counts. Let's get moving 🔥",
  "Your workout is waiting. Let's crush it today 💥",
  "Small steps every day lead to big results 🎯",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ sent: 0 });
  }
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  try {
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id');

    if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 });

    const uniqueUserIds = [...new Set(subs.map((s) => s.user_id as string))];
    const prefsMap = await getPreferencesMap(supabaseAdmin, uniqueUserIds);
    const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    let sent = 0;
    await Promise.allSettled(
      uniqueUserIds.map(async (userId) => {
        const prefs = prefsMap.get(userId);
        if (!prefs || !prefs.push_enabled || !prefs.training_reminders_enabled || !isPreferredHour(prefs)) {
          return;
        }
        await sendPushToUser(userId, {
          title: 'Daily Reminder',
          body,
          url: '/',
          tag: 'daily-reminder',
        });
        sent++;
      }),
    );

    return res.status(200).json({ sent });
  } catch (err) {
    console.error('[/api/daily-reminder]', err);
    return res.status(500).json({ error: 'Failed to send reminders' });
  }
}
