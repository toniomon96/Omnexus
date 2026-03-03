import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, ALLOWED_ORIGIN } from './_cors.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

const FREE_ASK_LIMIT = 5;
const FREE_PROGRAM_LIMIT = 1;
const PREMIUM_LIMIT = 999;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ALLOWED_ORIGIN);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Auth service not configured' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const [{ data: sub }, { data: usage }] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabaseAdmin
        .from('user_ai_usage')
        .select('ask_count, program_gen_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
    ]);

    const isPremium = !!sub;

    return res.status(200).json({
      tier: isPremium ? 'premium' : 'free',
      periodEnd: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      askCount: usage?.ask_count ?? 0,
      askLimit: isPremium ? PREMIUM_LIMIT : FREE_ASK_LIMIT,
      programGenCount: usage?.program_gen_count ?? 0,
      programGenLimit: isPremium ? PREMIUM_LIMIT : FREE_PROGRAM_LIMIT,
    });
  } catch (err) {
    console.error('[/api/subscription-status]', err);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}
