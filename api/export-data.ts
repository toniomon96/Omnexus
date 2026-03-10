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

  if (req.method !== 'GET') {
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
    // Fetch all user data in parallel
    const [profile, sessions, prs, learning, customPrograms] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: true }),
      supabaseAdmin.from('personal_records').select('*').eq('user_id', userId),
      supabaseAdmin.from('learning_progress').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('custom_programs').select('*').eq('user_id', userId),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: profile.data ?? null,
      workoutSessions: sessions.data ?? [],
      personalRecords: prs.data ?? [],
      learningProgress: learning.data ?? null,
      customPrograms: (customPrograms.data ?? []).map((row) => row.data),
    };

    const filename = `omnexus-data-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (err) {
    console.error('[/api/export-data]', err);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}
