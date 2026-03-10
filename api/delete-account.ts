import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Env validation ───────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── CORS helper ─────────────────────────────────────────────────────────────

import { setCorsHeaders } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;

  try {
    // BUG-16: Delete all user data in dependency order (children first).
    // Also removes tables that were missing from the original implementation.
    await Promise.all([
      supabaseAdmin.from('challenge_participants').delete().eq('user_id', userId),
      supabaseAdmin
        .from('challenge_invitations')
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabaseAdmin
        .from('friendships')
        .delete()
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabaseAdmin.from('personal_records').delete().eq('user_id', userId),
      supabaseAdmin.from('workout_sessions').delete().eq('user_id', userId),
      supabaseAdmin.from('learning_progress').delete().eq('user_id', userId),
      supabaseAdmin.from('custom_programs').delete().eq('user_id', userId),
      supabaseAdmin.from('nutrition_logs').delete().eq('user_id', userId),
      supabaseAdmin.from('subscriptions').delete().eq('user_id', userId),
      supabaseAdmin.from('user_ai_usage').delete().eq('user_id', userId),
      // Previously missing:
      supabaseAdmin.from('training_profiles').delete().eq('user_id', userId),
      supabaseAdmin.from('measurements').delete().eq('user_id', userId),
      supabaseAdmin.from('feed_reactions').delete().eq('user_id', userId),
    ]);

    // Clean up avatar storage (non-blocking — profile deletion is the critical step).
    supabaseAdmin.storage
      .from('avatars')
      .list(userId)
      .then(({ data: files }) => {
        if (files?.length) {
          return supabaseAdmin.storage
            .from('avatars')
            .remove(files.map(f => `${userId}/${f.name}`));
        }
      })
      .catch(err => console.error('[/api/delete-account] Avatar cleanup failed:', err));

    // Challenges created by the user — remove their ownership (or delete if desired)
    await supabaseAdmin.from('challenges').delete().eq('created_by', userId);

    // Delete the profile row
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Delete the auth user — this removes the account from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[/api/delete-account] Failed to delete auth user:', deleteError);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[/api/delete-account]', err);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
