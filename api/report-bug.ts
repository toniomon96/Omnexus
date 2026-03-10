import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit aggressively — bug reports don't need high throughput
  if (!await checkRateLimit(req, res)) return;

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service not configured' });
  }

  const { description, steps, email } = req.body ?? {};

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // Resolve the submitting user's ID from an optional Bearer token
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) userId = user.id;
  }

  const { error } = await supabaseAdmin.from('bug_reports').insert({
    user_id: userId,
    description: description.trim().slice(0, 2000),
    steps: typeof steps === 'string' ? steps.trim().slice(0, 2000) || null : null,
    contact_email: typeof email === 'string' ? email.trim().slice(0, 200) || null : null,
  });

  if (error) {
    console.error('[/api/report-bug]', error);
    return res.status(500).json({ error: 'Failed to save report' });
  }

  return res.status(200).json({ ok: true });
}
