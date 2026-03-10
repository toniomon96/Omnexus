import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const SYSTEM_PROMPT = `You are a fitness coach generating block missions for a training program.

Output ONLY valid JSON array (no markdown fences) of 4-5 missions with this shape:
[
  {
    "type": "pr" | "consistency" | "volume" | "rpe",
    "description": "string (clear, motivating goal description)",
    "target": {
      "metric": "string (e.g. 'new PR', 'sessions', 'kg total volume', 'avg RPE')",
      "value": number,
      "unit": "string (e.g. 'PR', 'sessions', 'kg', 'RPE')"
    }
  }
]

Mission type guidelines:
- "pr": Set a personal record on a key exercise
- "consistency": Complete a certain number of sessions during the program
- "volume": Accumulate a total weekly or block volume target
- "rpe": Maintain an average RPE within a target range for quality training

Make missions specific to the program's goal and experience level. Keep targets realistic but challenging.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await checkRateLimit(req, res)) return;

  // Auth: require Bearer token and derive userId from it
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = user.id;

  const {
    programId,
    programName,
    goal,
    experienceLevel,
    daysPerWeek,
    durationWeeks,
  } = req.body ?? {};

  if (!programId) {
    return res.status(400).json({ error: 'programId is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const userMessage = [
    `Program: ${programName ?? programId}`,
    `Goal: ${goal ?? 'general fitness'}`,
    `Experience level: ${experienceLevel ?? 'beginner'}`,
    `Days per week: ${daysPerWeek ?? 3}`,
    `Duration: ${durationWeeks ?? 8} weeks`,
  ].join('\n');

  let missions: unknown[];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    const cleaned = block.text.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    missions = JSON.parse(cleaned) as unknown[];
    if (!Array.isArray(missions)) throw new Error('Expected array');
  } catch (err) {
    console.error('[/api/generate-missions] Claude error:', err);
    // Fallback missions
    missions = [
      { type: 'consistency', description: `Complete ${(daysPerWeek ?? 3) * 4} sessions in the next 4 weeks`, target: { metric: 'sessions', value: (daysPerWeek ?? 3) * 4, unit: 'sessions' } },
      { type: 'pr', description: 'Set a new personal record on your primary compound lift', target: { metric: 'new PR', value: 1, unit: 'PR' } },
      { type: 'volume', description: 'Hit a weekly volume of 10,000 kg', target: { metric: 'weekly volume', value: 10000, unit: 'kg' } },
    ];
  }

  // Upsert to Supabase: delete existing active missions for this program, insert new

  try {
    await supabaseAdmin
      .from('block_missions')
      .delete()
      .eq('user_id', userId)
      .eq('program_id', programId)
      .eq('status', 'active');

    const rows = missions.map((m) => {
      const mission = m as { type: string; description: string; target: { metric: string; value: number; unit: string } };
      return {
        user_id: userId,
        program_id: programId,
        type: mission.type,
        description: mission.description,
        target: mission.target,
        progress: { current: 0, history: [] },
        status: 'active',
      };
    });

    const { data, error } = await supabaseAdmin
      .from('block_missions')
      .insert(rows)
      .select('*');

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      programId: row.program_id,
      type: row.type,
      description: row.description,
      target: row.target,
      progress: row.progress,
      status: row.status,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ missions: mapped });
  } catch (err) {
    console.error('[/api/generate-missions] DB error:', err);
    return res.status(500).json({ error: 'Failed to save missions' });
  }
}
