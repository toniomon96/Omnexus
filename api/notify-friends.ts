import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getPreferencesMap } from './_notificationPrefs.js';
import { sendPushToUsers } from './_sendPush.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

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

  const [profileResult, friendshipsResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('name').eq('id', user.id).single(),
    supabaseAdmin
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted'),
  ]);

  const friendIds = (friendshipsResult.data ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id,
  );

  if (friendIds.length === 0) return res.status(200).json({ sent: 0 });

  const prefsMap = await getPreferencesMap(supabaseAdmin, friendIds);
  const eligibleFriendIds = friendIds.filter((id) => {
    const pref = prefsMap.get(id);
    return !!pref?.push_enabled && !!pref?.community_enabled;
  });

  if (eligibleFriendIds.length === 0) return res.status(200).json({ sent: 0 });

  const userName = profileResult.data?.name ?? 'Your friend';
  await sendPushToUsers(eligibleFriendIds, {
    title: 'Friend Activity',
    body: `${userName} just completed a workout 💪`,
    url: '/feed',
    tag: 'friend-workout',
  });

  return res.status(200).json({ sent: eligibleFriendIds.length });
}
