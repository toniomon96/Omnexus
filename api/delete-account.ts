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

type DeleteStep = {
  name: string;
  execute: () =>
    | PromiseLike<{ error: { message?: string } | null } | void>
    | { error: { message?: string } | null }
    | void;
};

async function runDeleteSteps(steps: DeleteStep[]): Promise<Array<{ step: string; message: string }>> {
  for (const step of steps) {
    try {
      const result = await Promise.resolve(step.execute());
      const error = result && 'error' in result ? result.error : null;
      if (error) {
        return [{ step: step.name, message: error.message ?? 'Unknown database error' }];
      }
    } catch (err) {
      return [{
        step: step.name,
        message: err instanceof Error ? err.message : 'Unexpected error',
      }];
    }
  }

  return [];
}

async function deleteAvatarObjects(userId: string): Promise<{ error: { message?: string } | null }> {
  try {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('avatars')
      .list(userId);

    if (listError) {
      return { error: { message: listError.message } };
    }

    if (!files || files.length === 0) {
      return { error: null };
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from('avatars')
      .remove(files.map((f) => `${userId}/${f.name}`));

    return { error: removeError ?? null };
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : 'Avatar cleanup failed' },
    };
  }
}

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
  const userEmail = user.email ?? '';

  try {
    // Delete in dependency order and fail closed if any cleanup target fails.
    const failures = await runDeleteSteps([
      { name: 'challenge_participants', execute: () => supabaseAdmin.from('challenge_participants').delete().eq('user_id', userId) },
      {
        name: 'challenge_invitations',
        execute: () => supabaseAdmin
          .from('challenge_invitations')
          .delete()
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      },
      {
        name: 'friendships',
        execute: () => supabaseAdmin
          .from('friendships')
          .delete()
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      },
      { name: 'feed_reactions', execute: () => supabaseAdmin.from('feed_reactions').delete().eq('user_id', userId) },
      { name: 'personal_records', execute: () => supabaseAdmin.from('personal_records').delete().eq('user_id', userId) },
      { name: 'workout_sessions', execute: () => supabaseAdmin.from('workout_sessions').delete().eq('user_id', userId) },
      { name: 'learning_progress', execute: () => supabaseAdmin.from('learning_progress').delete().eq('user_id', userId) },
      { name: 'custom_programs', execute: () => supabaseAdmin.from('custom_programs').delete().eq('user_id', userId) },
      { name: 'workout_templates', execute: () => supabaseAdmin.from('workout_templates').delete().eq('user_id', userId) },
      { name: 'nutrition_logs', execute: () => supabaseAdmin.from('nutrition_logs').delete().eq('user_id', userId) },
      { name: 'subscriptions', execute: () => supabaseAdmin.from('subscriptions').delete().eq('user_id', userId) },
      { name: 'user_ai_usage', execute: () => supabaseAdmin.from('user_ai_usage').delete().eq('user_id', userId) },
      { name: 'training_profiles', execute: () => supabaseAdmin.from('training_profiles').delete().eq('user_id', userId) },
      { name: 'measurements', execute: () => supabaseAdmin.from('measurements').delete().eq('user_id', userId) },
      { name: 'block_missions', execute: () => supabaseAdmin.from('block_missions').delete().eq('user_id', userId) },
      { name: 'ai_challenges', execute: () => supabaseAdmin.from('ai_challenges').delete().eq('user_id', userId) },
      { name: 'notification_preferences', execute: () => supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId) },
      { name: 'notification_events', execute: () => supabaseAdmin.from('notification_events').delete().eq('user_id', userId) },
      { name: 'push_subscriptions', execute: () => supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId) },
      {
        name: 'auth_login_attempts',
        execute: () => userEmail
          ? supabaseAdmin.from('auth_login_attempts').delete().eq('email', userEmail)
          : Promise.resolve({ error: null }),
      },
      // Challenges created by the user are user-owned entities.
      { name: 'challenges', execute: () => supabaseAdmin.from('challenges').delete().eq('created_by', userId) },
      { name: 'avatars_storage', execute: () => deleteAvatarObjects(userId) },
      // Delete profile last before auth user deletion.
      { name: 'profiles', execute: () => supabaseAdmin.from('profiles').delete().eq('id', userId) },
    ]);

    if (failures.length > 0) {
      console.error('[/api/delete-account] Cleanup failed; auth user not deleted:', failures);
      return res.status(500).json({
        error: 'Failed to fully delete account data',
        failedSteps: failures.map((f) => f.step),
      });
    }

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
