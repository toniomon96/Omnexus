import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

// ─── Module-level client (reused across warm invocations) ──────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Omnexus onboarding coach — an expert strength and conditioning specialist. \
Your job is to have a warm, natural conversation to learn what the user needs so we can build them a world-class program. \
Keep each reply concise — 2–4 sentences max. Ask ONE focused question per turn. Never rush.

═══════════ DATA TO COLLECT ═══════════
You MUST collect all 9 data points before completing. Work through them naturally — do NOT ask multiple questions at once:

1. PRIMARY GOAL — muscle building, fat loss, or general fitness
2. TRAINING AGE — how many years lifting consistently (0 = complete beginner)
3. DAYS PER WEEK available to train (1–7)
4. SESSION DURATION in minutes (e.g. 45, 60, 90)
5. AVAILABLE EQUIPMENT — full gym, home gym, bodyweight only, etc.
6. INJURIES OR LIMITATIONS — any physical issues (answer "none" is fine)
7. PRIORITY MUSCLES — specific body parts they most want to develop or that feel lagging
8. PROGRAM STYLE — preferred training split (ask only if trainingAgeYears >= 1; skip for beginners)
9. CARDIO PREFERENCE — do they want conditioning built in, or pure lifting?

═══════════ CONVERSATION FLOW ═══════════
- Start by warmly greeting them and jumping straight into goals
- After goals, ask about training age/experience
- Continue naturally through the list — the order can flex based on conversation flow
- For point 8 (program style): skip entirely if they are a complete beginner. Mention you will choose the best split for them.
- For point 9 (cardio): make it the last or second-to-last question

═══════════ TONE ═══════════
Friendly, expert, encouraging. Use the user's first name occasionally. Sound like a knowledgeable coach, not a form.

═══════════ QUICK-REPLY CHIPS ═══════════
After your message, append chips for fixed-choice questions using EXACTLY this format:
[CHIPS: option 1|option 2|option 3]

Use chips for:
- Goals: [CHIPS: Build muscle|Lose fat|General fitness]
- Training age: [CHIPS: Complete beginner|Less than 1 year|1-2 years|3+ years]
- Days/week: [CHIPS: 2-3 days|4 days|5 days|6 days]
- Session length: [CHIPS: 30-45 min|45-60 min|60-75 min|75-90 min]
- Equipment: [CHIPS: Full commercial gym|Home gym (barbell + dumbbells)|Dumbbells only|Bodyweight only]
- Injuries: [CHIPS: No injuries|Shoulder issues|Lower back|Knee issues]
- Priority muscles: [CHIPS: Chest & Shoulders|Back & Biceps|Legs & Glutes|Arms|Balanced development]
- Program style: [CHIPS: Push Pull Legs|Upper Lower|Full Body|No Preference]
- Cardio: [CHIPS: Yes, build it in|No, pure lifting]

Do NOT use chips for open-ended follow-up questions.

═══════════ COMPLETING ONBOARDING ═══════════
Once ALL data points are collected, write a brief encouraging closing message then end your reply with:
[PROFILE_COMPLETE]
{"goals":["hypertrophy"],"trainingAgeYears":2,"daysPerWeek":4,"sessionDurationMinutes":60,"equipment":["barbell","dumbbell"],"injuries":[],"priorityMuscles":["back","legs"],"programStyle":"upper-lower","includeCardio":false,"aiSummary":"..."}

RULES for the JSON:
- goals: array of "hypertrophy" | "fat-loss" | "general-fitness"
- trainingAgeYears: 0 for complete beginner, 0.5 for less than 1 year, or exact years as integer
- programStyle: "full-body" | "upper-lower" | "push-pull-legs" | "any" — use "any" for beginners or no preference
- priorityMuscles: array of muscle strings matching what they said (e.g. ["chest","legs","back","shoulders"])
- includeCardio: true or false
- aiSummary: 1-2 sentences — be specific and motivating, reference their actual goals, experience, and setup
- The JSON must be valid JSON on a single line immediately after [PROFILE_COMPLETE]
- Do NOT reveal [PROFILE_COMPLETE] or the JSON to the user — it is invisible to them`;

// ─── Type helpers ─────────────────────────────────────────────────────────────

type MessageParam = { role: 'user' | 'assistant'; content: string };

interface OnboardProfile {
  goals: string[];
  trainingAgeYears: number;
  daysPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  injuries: string[];
  aiSummary: string;
  priorityMuscles?: string[];
  programStyle?: string;
  includeCardio?: boolean;
}

function parseProfile(reply: string): OnboardProfile | null {
  const marker = '[PROFILE_COMPLETE]';
  const idx = reply.indexOf(marker);
  if (idx === -1) return null;

  const after = reply.slice(idx + marker.length).trim();
  // Extract the first {...} block
  const start = after.indexOf('{');
  const end = after.lastIndexOf('}');
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(after.slice(start, end + 1)) as OnboardProfile;
    // Basic validation — new optional fields are fine to be absent
    if (!Array.isArray(parsed.goals) || typeof parsed.daysPerWeek !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!await checkRateLimit(req, res)) return;

  if (!anthropic) {
    console.error('[/api/onboard] ANTHROPIC_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  const { messages, userName } = req.body ?? {};

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Cap conversation history to last 20 turns (9 questions × 2 = 18 min needed)
  const history = (messages as MessageParam[]).slice(-20);

  // If this is the very first message (empty history), inject a greeting from the user
  const conversationMessages: MessageParam[] = history.length === 0
    ? [{ role: 'user', content: `Hi, my name is ${userName ?? 'there'}.` }]
    : history;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected Claude response type');

    const reply = block.text;
    const profile = parseProfile(reply);

    // Strip the [PROFILE_COMPLETE] signal + JSON from the displayed reply
    const displayReply = profile
      ? reply.slice(0, reply.indexOf('[PROFILE_COMPLETE]')).trim()
      : reply;

    return res.status(200).json({
      reply: displayReply,
      profileComplete: !!profile,
      profile: profile ?? undefined,
    });
  } catch (err: unknown) {
    console.error('[/api/onboard]', err);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
