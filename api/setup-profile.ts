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

import { setCorsHeaders, ALLOWED_ORIGIN } from './_cors.js';

// ─── Valid enum values ────────────────────────────────────────────────────────

const VALID_GOALS = new Set(['hypertrophy', 'fat-loss', 'general-fitness']);
const VALID_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ALLOWED_ORIGIN);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, name, goal, experienceLevel, activeProgramId } = req.body ?? {};

  if (!userId || !name || !goal || !experienceLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Input sanitization
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'name must be a non-empty string under 100 characters' });
  }
  if (!VALID_GOALS.has(goal)) {
    return res.status(400).json({ error: 'goal must be one of: hypertrophy, fat-loss, general-fitness' });
  }
  if (!VALID_LEVELS.has(experienceLevel)) {
    return res.status(400).json({ error: 'experienceLevel must be one of: beginner, intermediate, advanced' });
  }

  // If an Authorization header is present, validate the token matches userId
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const {
      data: { user: tokenUser },
      error: tokenError,
    } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !tokenUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (tokenUser.id !== userId) {
      return res.status(403).json({ error: 'Token user does not match userId' });
    }
  }

  const { error } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    name: name.trim(),
    goal,
    experience_level: experienceLevel,
    active_program_id: activeProgramId ?? null,
  });

  if (error) {
    // Profile already exists — treat as success (idempotent)
    if (error.code === '23505') {
      return res.status(200).json({ ok: true });
    }
    // FK violation — userId does not exist in auth.users (invalid or obfuscated ID)
    if (error.code === '23503') {
      return res.status(401).json({ error: 'User not found' });
    }
    console.error('[/api/setup-profile]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(200).json({ ok: true });
}
