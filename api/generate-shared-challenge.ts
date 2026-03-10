import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `You are a fitness coach creating a weekly community challenge for a fitness app.

Output ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string (catchy community challenge title, under 60 chars)",
  "description": "string (1-2 sentences, community-focused, motivating)",
  "metric": "total_volume" | "sessions_count" | "pr_count" | "consistency",
  "target": number,
  "unit": "string"
}

The challenge should be inclusive for all fitness levels. Make it community-focused and motivating.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  // Vercel cron uses GET
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Gather aggregate stats from last 7 days for context
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let statsContext = 'Community stats unavailable.';

  try {
    const { data: sessions } = await supabaseAdmin
      .from('workout_sessions')
      .select('total_volume_kg')
      .gte('started_at', weekAgo.toISOString())
      .not('completed_at', 'is', null);

    if (sessions && sessions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalVol = (sessions as any[]).reduce((sum: number, s: any) => sum + (s.total_volume_kg ?? 0), 0);
      statsContext = `Last week: ${sessions.length} sessions completed, ${Math.round(totalVol).toLocaleString()} kg total volume lifted.`;
    }
  } catch {
    // Use default context
  }

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 7);
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  const userMessage = [
    `Today is ${dayOfWeek}. Generate a 7-day community challenge starting today.`,
    statsContext,
    'Create an engaging challenge that motivates the whole community.',
  ].join('\n');

  let challengeData: {
    title: string;
    description: string;
    metric: string;
    target: number;
    unit: string;
  };

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

    const cleaned = block.text.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    challengeData = JSON.parse(cleaned) as typeof challengeData;
    if (!challengeData.title || !challengeData.metric) throw new Error('Invalid shape');
  } catch (err) {
    console.error('[/api/generate-shared-challenge] Claude error:', err);
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    challengeData = {
      title: `${month} Community Volume Week`,
      description: 'Lift together and push your limits this week as a community.',
      metric: 'sessions_count',
      target: 3,
      unit: 'sessions',
    };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_challenges')
      .insert({
        user_id: null,
        type: 'shared',
        title: challengeData.title,
        description: challengeData.description,
        metric: challengeData.metric,
        target: challengeData.target,
        unit: challengeData.unit,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Insert failed');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    const challenge = {
      id: row.id,
      userId: null,
      type: row.type,
      title: row.title,
      description: row.description,
      metric: row.metric,
      target: Number(row.target),
      unit: row.unit,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
    };

    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('[/api/generate-shared-challenge] DB error:', err);
    return res.status(500).json({ error: 'Failed to save shared challenge' });
  }
}
