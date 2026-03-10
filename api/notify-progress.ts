import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { canSendNotificationNow, getPreferencesMap } from './_notificationPrefs.js';
import { pickProgressMessages, type SessionRow } from './_progressMilestones.js';
import { sendNotificationReliably } from './_notify.js';

const LOOKBACK_DAYS = 365;
const RECENT_WINDOW_MS = 2 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ sent: 0 });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).end();

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).end();

  const prefsMap = await getPreferencesMap(supabaseAdmin, [user.id]);
  const prefs = prefsMap.get(user.id);
  if (!prefs || !prefs.push_enabled || !prefs.progress_enabled || !canSendNotificationNow(prefs)) {
    return res.status(200).json({ sent: 0 });
  }

  const nowMs = Date.now();
  const recentCutoffIso = new Date(nowMs - RECENT_WINDOW_MS).toISOString();
  const lookbackIso = new Date(nowMs - LOOKBACK_DAYS * 86_400_000).toISOString();

  const { data } = await supabaseAdmin
    .from('workout_sessions')
    .select('user_id, started_at, total_volume_kg')
    .eq('user_id', user.id)
    .gte('started_at', lookbackIso)
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: true });

  const sessions = (data ?? []) as SessionRow[];
  const recentSessions = sessions.filter((s) => s.started_at >= recentCutoffIso);
  const messages = pickProgressMessages(sessions, recentSessions, nowMs);

  if (messages.length === 0) return res.status(200).json({ sent: 0 });

  const dayKey = new Date(nowMs).toISOString().slice(0, 10);
  const results = await Promise.all(
    messages.map((message) =>
      sendNotificationReliably({
        supabaseAdmin,
        userId: user.id,
        eventType: 'progress_milestone',
        dedupeKey: `progress:${user.id}:${message.tag ?? 'generic'}:${dayKey}`,
        payload: message,
      }),
    ),
  );

  const sent = results.filter((result) => result.status === 'sent').length;
  return res.status(200).json({ sent });
}
