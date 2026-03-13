import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { sanitizeFreeText } from './_aiSafety.js';

// ─── Module-level clients ──────────────────────────────────────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ─── Constants ─────────────────────────────────────────────────────────────────

const CLAUDE_MODEL = process.env.ASK_MODEL ?? 'claude-3-5-haiku-20241022';
const CHECKIN_SYSTEM_PROMPT = `You are Omni, the AI coach for Omnexus. \
Given a user's daily readiness check-in data, generate a single concise sentence (under 25 words) \
recommending how they should approach their training today. \
Be direct and specific. Do NOT start with "I" or affirmations. \
Examples: "Reduce working sets by 1 and stay 2–3 reps from failure today." \
or "You're fully recovered — push intensity and aim for top-set PRs."`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function buildCheckinPrompt(data: {
  energyLevel: number;
  sleepQuality: number;
  sorenessLevel: number;
  painFlag: boolean;
  painLocation?: string;
  notes?: string;
}): string {
  const parts = [
    `Energy level: ${data.energyLevel}/10`,
    `Sleep quality: ${data.sleepQuality}/10`,
    `Soreness: ${data.sorenessLevel}/5`,
    data.painFlag ? `Pain reported: yes${data.painLocation ? ` (${data.painLocation})` : ''}` : 'Pain: none',
  ];
  if (data.notes) parts.push(`Notes: ${data.notes}`);
  return parts.join('\n');
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:checkin', limit: 10, window: '1 h' })) return;

  // Resolve authenticated user if bearer token present (required for DB write)
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
    }
  }

  const body = req.body ?? {};
  const energyLevel = clamp(Number(body.energyLevel), 1, 10);
  const sleepQuality = clamp(Number(body.sleepQuality), 1, 10);
  const sorenessLevel = clamp(Number(body.sorenessLevel), 1, 5);
  const painFlag = body.painFlag === true;
  const painLocation = typeof body.painLocation === 'string'
    ? sanitizeFreeText(body.painLocation, 100) ?? undefined
    : undefined;
  const notes = typeof body.notes === 'string'
    ? sanitizeFreeText(body.notes, 300) ?? undefined
    : undefined;

  if (isNaN(energyLevel) || isNaN(sleepQuality) || isNaN(sorenessLevel)) {
    return res.status(400).json({ error: 'energyLevel, sleepQuality, and sorenessLevel are required' });
  }

  // Derive adaptation flags
  const reduceIntensity = energyLevel < 5 || sleepQuality < 5;
  const flaggedExercises: string[] = painFlag && painLocation
    ? [`Avoid heavy loading of ${painLocation}`]
    : [];

  // Generate Omni's recommendation
  let omniResponse = 'Keep effort moderate and listen to your body today.';
  if (anthropic) {
    try {
      const prompt = buildCheckinPrompt({ energyLevel, sleepQuality, sorenessLevel, painFlag, painLocation, notes });
      const message = await Promise.race([
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 80,
          system: CHECKIN_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000),
        ),
      ]);
      const block = message.content[0];
      if (block.type === 'text' && block.text.trim()) {
        omniResponse = block.text.trim();
      }
    } catch {
      // Non-fatal — use default recommendation
    }
  }

  const checkinId = crypto.randomUUID();
  const today = new Date().toISOString().split('T')[0];

  // Persist to Supabase if user is authenticated
  if (supabaseAdmin && userId) {
    supabaseAdmin.from('daily_checkins').upsert({
      id: checkinId,
      user_id: userId,
      checkin_date: today,
      energy_level: energyLevel,
      sleep_quality: sleepQuality,
      soreness_level: sorenessLevel,
      pain_flag: painFlag,
      pain_location: painLocation ?? null,
      notes: notes ?? null,
      omni_response: omniResponse,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,checkin_date' })
      .then(() => {/* fire-and-forget */})
      .catch((err: unknown) => {
        console.warn('[api/checkin] db write failed', err instanceof Error ? err.message : err);
      });
  }

  return res.status(200).json({
    checkinId,
    omniResponse,
    reduceIntensity,
    flaggedExercises,
  });
}
