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

const BRIEFING_MODEL = process.env.BRIEFING_MODEL ?? 'claude-3-5-haiku-latest';
const BRIEFING_TIMEOUT_MS = 8000;

function buildFallbackBriefing(exerciseNames: string[], goal: string, level: string): string {
  const exerciseList = exerciseNames.slice(0, 5).join(', ');
  return `Quick pre-workout focus for ${goal} (${level}): Start with 1-2 progressive warm-up sets on your first movement, then keep working sets around RPE 7-8 unless the last session felt very easy. Prioritize technical quality and controlled reps on ${exerciseList}. If top sets move cleanly, progress by about 2.5-5 kg or 1-2 reps on your final working set. Lock in and execute.`;
}

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

    const message = await Promise.race([
      client.messages.create({
        model: BRIEFING_MODEL,
        max_tokens: 320,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Briefing request timed out')), BRIEFING_TIMEOUT_MS),
      ),
    ]);

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    return res.status(200).json({ briefing: block.text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate briefing';
    if (msg.includes('timed out')) {
      return res.status(200).json({
        briefing: buildFallbackBriefing(
          exerciseNames as string[],
          userContext?.goal ?? 'general fitness',
          userContext?.experienceLevel ?? 'beginner',
        ),
        degraded: true,
      });
    }
    console.error('[/api/briefing]', err);
    return res.status(500).json({ error: msg });
  }
}
