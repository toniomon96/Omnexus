import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const SYSTEM_PROMPT = `You are a fitness coach creating a personal 7-day challenge for a user.

Output ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string (catchy, motivating, under 50 chars)",
  "description": "string (1-2 sentences explaining the challenge)",
  "metric": "total_volume" | "sessions_count" | "pr_count" | "consistency",
  "target": number,
  "unit": "string (e.g. 'kg', 'sessions', 'PRs', '% sessions completed')"
}

Make the challenge achievable but meaningful based on the user's recent stats and goals.
- total_volume: total kg lifted across all sessions this week
- sessions_count: number of sessions to complete
- pr_count: number of personal records to set
- consistency: percentage of planned sessions to complete (0-100)`;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const { goal, experienceLevel, recentStats } = req.body ?? {};
  const stats = recentStats ?? { weeklyVolume: 0, sessionsLast30Days: 0, avgRpe: 0 };
  const userMessage = [
    `Goal: ${goal ?? 'general fitness'}`,
    `Experience level: ${experienceLevel ?? 'beginner'}`,
    `Recent stats (last 30 days):`,
    `  Average weekly volume: ${stats.weeklyVolume ?? 0} kg`,
    `  Sessions completed: ${stats.sessionsLast30Days ?? 0}`,
    `  Average RPE: ${stats.avgRpe ?? 0}`,
    `Create a 7-day personal challenge appropriate for this user.`,
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
    if (!challengeData.title || !challengeData.metric || challengeData.target === undefined) {
      throw new Error('Invalid response shape');
    }
  } catch (err) {
    console.error('[/api/generate-personal-challenge] Claude error:', err);
    challengeData = {
      title: '7-Day Consistency Challenge',
      description: 'Complete 3 workouts this week to build your training habit.',
      metric: 'sessions_count',
      target: 3,
      unit: 'sessions',
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_challenges')
      .insert({
        user_id: userId,
        type: 'personal',
        title: challengeData.title,
        description: challengeData.description,
        metric: challengeData.metric,
        target: challengeData.target,
        unit: challengeData.unit,
        start_date: today,
        end_date: endDate.toISOString().split('T')[0],
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Insert failed');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    const challenge = {
      id: row.id,
      userId: row.user_id,
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
    console.error('[/api/generate-personal-challenge] DB error:', err);
    return res.status(500).json({ error: 'Failed to save challenge' });
  }
}
