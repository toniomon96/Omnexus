import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { hasPromptInjectionSignals, sanitizeFreeText } from './_aiSafety.js';

const SYSTEM_PROMPT = `You are a certified sports nutritionist. Generate a one-day educational meal plan that meets the user's macro targets.

Return ONLY valid JSON in this exact structure (no extra text, no markdown fences):
{
  "planType": "weight-loss | weight-gain | maintenance",
  "overview": "2-3 sentence beginner-friendly explanation of today's plan",
  "dailyTips": ["tip 1", "tip 2", "tip 3"],
  "hydrationReminder": "Simple hydration reminder",
  "meals": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "calories": 500,
      "proteinG": 40,
      "carbsG": 50,
      "fatG": 15,
      "mealTime": "Breakfast"
    }
  ],
  "totalCalories": 2500,
  "totalProtein": 180,
  "totalCarbs": 250,
  "totalFat": 70
}

Rules:
- Include 4-6 meals covering Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Dinner, and optionally Post-Workout.
- Meals must be realistic, whole-food based, and easy to prepare.
- Honor any dietary preferences provided.
- Sum of meal macros must equal (or be within 5%) of the totals.
- Include beginner-friendly guidance and practical habit coaching.
- Do not add any commentary outside the JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:meal-plan', limit: 8, window: '10 m' })) return;

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

  const { calories, proteinG, carbsG, fatG, preferences, planType } = req.body ?? {};

  if (!calories || !proteinG || !carbsG || !fatG) {
    return res.status(400).json({ error: 'calories, proteinG, carbsG, fatG are required' });
  }

  const safePrefs = sanitizeFreeText(preferences, 500);
  if (safePrefs && hasPromptInjectionSignals(safePrefs)) {
    return res.status(400).json({ error: 'Unsupported instruction-like preferences. Please provide plain dietary preferences.' });
  }

  const safePlanType =
    planType === 'weight-loss' || planType === 'weight-gain' || planType === 'maintenance'
      ? planType
      : 'maintenance';

  const userMessage = [
    `Plan type: ${safePlanType}`,
    `Daily targets: ${calories} kcal, ${proteinG}g protein, ${carbsG}g carbs, ${fatG}g fat`,
    safePrefs ? `Dietary preferences: ${safePrefs}` : '',
    'Add beginner guidance for hydration, meal structure, and consistency habits.',
  ].filter(Boolean).join('\n');

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

    // Strip any markdown fences if the model wraps JSON
    const raw = block.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const plan = JSON.parse(raw);

    return res.status(200).json({ plan });
  } catch (err: unknown) {
    console.error('[/api/meal-plan]', err);
    return res.status(500).json({ error: 'Failed to generate meal plan right now. Please try again.' });
  }
}
