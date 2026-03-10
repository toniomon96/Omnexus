import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
  timestamp: string;
}

interface ExerciseSets {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
}

const SYSTEM_PROMPT = `You are an expert strength coach analyzing workout data to recommend next-session adjustments.

Given per-exercise historical data and today's session, output ONLY valid JSON (no markdown fences) in this exact shape:
{
  "adaptations": [
    {
      "exerciseId": "string",
      "exerciseName": "string",
      "action": "increase_weight" | "decrease_weight" | "increase_reps" | "maintain" | "deload",
      "suggestion": "string (concise, e.g. 'Add 2.5 kg next session')",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "summary": "string (1-2 sentences about the overall session quality and direction)"
}

Rules:
- Use double-progression: fill all reps first, then increase weight
- Recommend deload if RPE ≥ 9 for 2+ consecutive sessions
- Only include exercises that have enough data to assess (at least 1 completed set)
- Keep suggestions specific and actionable`;

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

  const { sessionId, exerciseSets } = req.body ?? {};

  if (!Array.isArray(exerciseSets) || exerciseSets.length === 0) {
    return res.status(400).json({ error: 'exerciseSets are required' });
  }

  if (exerciseSets.length > 20) {
    return res.status(400).json({ error: 'Too many exercises — maximum 20' });
  }

  for (const ex of exerciseSets) {
    if (!ex || typeof ex.exerciseId !== 'string' || typeof ex.exerciseName !== 'string' || !Array.isArray(ex.sets)) {
      return res.status(400).json({ error: 'Invalid exerciseSets format' });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  // Fetch last 3 sessions per exercise for historical context
  let historySummary = '';
  try {
    const { data: sessions } = await supabaseAdmin
      .from('workout_sessions')
      .select('id, started_at, exercises')
      .eq('user_id', userId)
      .neq('id', sessionId ?? '')
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(10);

    if (sessions && sessions.length > 0) {
      const exerciseIds = (exerciseSets as ExerciseSets[]).map((e) => e.exerciseId);
      const historyLines: string[] = [];
      for (const exId of exerciseIds) {
        const exName = (exerciseSets as ExerciseSets[]).find((e) => e.exerciseId === exId)?.exerciseName ?? exId;
        const rows: string[] = [];
        for (const session of sessions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logged = (session.exercises as any[])?.find((e: any) => e.exerciseId === exId);
          if (!logged) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const completedSets = (logged.sets as any[])?.filter((s: any) => s.completed) ?? [];
          if (completedSets.length === 0) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const avgRpe = completedSets.some((s: any) => s.rpe)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (completedSets.reduce((sum: number, s: any) => sum + (s.rpe ?? 0), 0) / completedSets.length).toFixed(1)
            : 'N/A';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const setsStr = completedSets.map((s: any) => `${s.weight}kg×${s.reps}`).join(', ');
          rows.push(`  ${session.started_at.split('T')[0]}: ${setsStr} (RPE: ${avgRpe})`);
          if (rows.length >= 3) break;
        }
        if (rows.length > 0) {
          historyLines.push(`${exName} history:\n${rows.join('\n')}`);
        }
      }
      historySummary = historyLines.join('\n\n');
    }
  } catch {
    // Non-fatal: proceed without history
  }

  // Build today's session summary
  const todaySummary = (exerciseSets as ExerciseSets[]).map((ex) => {
    const completedSets = ex.sets.filter((s) => s.completed);
    if (completedSets.length === 0) return null;
    const avgRpe = completedSets.some((s) => s.rpe)
      ? (completedSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / completedSets.length).toFixed(1)
      : 'N/A';
    const setsStr = completedSets.map((s) => `${s.weight}kg×${s.reps}`).join(', ');
    return `${ex.exerciseName}: ${setsStr} (RPE: ${avgRpe})`;
  }).filter(Boolean).join('\n');

  if (!todaySummary) {
    return res.status(200).json({ adaptations: [], summary: 'No completed sets to analyze.' });
  }

  const userMessage = [
    historySummary ? `Historical data:\n${historySummary}\n` : '',
    `Today's session:\n${todaySummary}`,
  ].join('\n').trim();

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
    const parsed = JSON.parse(cleaned) as { adaptations: unknown[]; summary: string };

    if (!Array.isArray(parsed.adaptations) || typeof parsed.summary !== 'string') {
      throw new Error('Invalid response shape');
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[/api/adapt]', err);
    // Fallback: return empty adaptations with generic summary
    return res.status(200).json({
      adaptations: [],
      summary: 'Great session! Keep progressive overload in mind for your next workout.',
    });
  }
}
