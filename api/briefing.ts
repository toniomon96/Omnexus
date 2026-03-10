import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert strength and conditioning coach preparing an athlete for their upcoming workout.

You will receive:
- The user's fitness goal and experience level
- Today's exercise list
- Historical performance data for each exercise (recent max weights and reps)

Your job is to provide a concise, actionable pre-workout briefing (≤300 words) that:
1. Names the specific target weights for key exercises based on their history
2. Suggests sensible progression (typically +2.5–5 kg if they hit all reps last session)
3. Flags any recovery concerns if session frequency is very high
4. Ends with a motivational, focused call to action

FORMAT:
- Use bold exercise names when recommending specific targets
- Keep it punchy and energizing — this is a pre-workout pep talk backed by data
- Do NOT pad with generic advice; be specific to the data provided

HARD CONSTRAINTS:
- NEVER recommend weights that seem unsafe or represent extreme jumps
- NEVER invent data not present in the history`;

// ─── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await checkRateLimit(req, res)) return;

  // Optional Bearer auth
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const token = authHeader.slice(7);
      const admin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  const { exerciseNames, recentHistory, userContext } = req.body ?? {};

  if (!Array.isArray(exerciseNames) || exerciseNames.length === 0) {
    return res.status(400).json({ error: 'exerciseNames is required' });
  }

  const historyText = (recentHistory as Array<{ name: string; recent: string[] }> ?? [])
    .map((h) => `${h.name}: ${h.recent.join(', ')}`)
    .join('\n');

  const userMessage = [
    `Goal: ${userContext?.goal ?? 'general fitness'}`,
    `Experience: ${userContext?.experienceLevel ?? 'beginner'}`,
    '',
    `Today's workout: ${(exerciseNames as string[]).join(', ')}`,
    '',
    historyText ? `Recent performance:\n${historyText}` : 'No recent history available.',
  ].join('\n');

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    return res.status(200).json({ briefing: block.text });
  } catch (err: unknown) {
    console.error('[/api/briefing]', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate briefing';
    return res.status(500).json({ error: msg });
  }
}
