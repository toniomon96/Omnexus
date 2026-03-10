import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Omnexus AI, a health and fitness education assistant. \
Your task is to generate a concise, evidence-based micro-lesson in JSON format.

OUTPUT RULES:
- Respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.
- The JSON must match this exact schema:
  {
    "title": "string (concise lesson title)",
    "content": "string (300-500 words, evidence-based markdown prose with **bold headings** for sections)",
    "keyPoints": ["string", "string", "string", "string"],
    "references": [
      { "title": "string", "authors": "string", "journal": "string", "year": number, "url": "string", "type": "journal|guideline|book|organization|meta-analysis" }
    ],
    "estimatedMinutes": number
  }
- keyPoints: exactly 4-5 items, each a single clear sentence.
- references: 2-3 peer-reviewed sources with real PubMed URLs when possible.
- estimatedMinutes: integer between 3 and 10 based on content length.
- content: include the physiological mechanism, practical application, and acknowledge any uncertainty.
- End content with the disclaimer: "> ⚠️ This is educational information only, not medical advice."`;

// ─── Fallback lesson ──────────────────────────────────────────────────────────

function fallbackLesson(topic: string) {
  return {
    title: topic,
    content: `This topic — **${topic}** — is an active area of sports science research.\n\nWhile specific evidence-based guidance on this exact subject may be limited within our current content library, the general principles of progressive overload, adequate recovery, and sound nutrition apply universally.\n\nFor personalized guidance on this topic, consider consulting a qualified exercise scientist or registered dietitian.\n\n> ⚠️ This is educational information only, not medical advice.`,
    keyPoints: [
      'Evidence-based training principles apply broadly across fitness topics.',
      'Progressive overload, recovery, and nutrition are foundational to all goals.',
      'Individual variation means general guidelines may need personalisation.',
      'A qualified professional can provide tailored guidance for specific questions.',
    ],
    references: [],
    estimatedMinutes: 3,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await checkRateLimit(req, res)) return;

  const { topic, userGoal, experienceLevel, relatedExerciseIds } = req.body ?? {};

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: 'topic is required' });
  }
  if (topic.length > 200) {
    return res.status(400).json({ error: 'topic too long (max 200 characters)' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[/api/generate-lesson] ANTHROPIC_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  const contextParts: string[] = [];
  if (userGoal) contextParts.push(`User goal: ${userGoal}`);
  if (experienceLevel) contextParts.push(`Experience level: ${experienceLevel}`);
  if (Array.isArray(relatedExerciseIds) && relatedExerciseIds.length > 0) {
    contextParts.push(`Related exercises: ${relatedExerciseIds.slice(0, 5).join(', ')}`);
  }

  const userMessage = [
    `Generate a micro-lesson about: "${topic.trim()}"`,
    contextParts.length > 0 ? `Context — ${contextParts.join('; ')}.` : '',
    'Tailor the depth and examples to the user context. Output only the JSON object.',
  ].filter(Boolean).join('\n');

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected Claude response type');

    // Strip any accidental markdown fences
    let raw = block.text.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error('[/api/generate-lesson] JSON parse failed, using fallback', raw.slice(0, 200));
      const lesson = {
        ...fallbackLesson(topic.trim()),
        isGenerated: true as const,
        generatedAt: new Date().toISOString(),
        topic: topic.trim(),
      };
      return res.status(200).json({ lesson });
    }

    // Validate required fields
    const hasRequired =
      typeof parsed.title === 'string' &&
      typeof parsed.content === 'string' &&
      Array.isArray(parsed.keyPoints) &&
      Array.isArray(parsed.references) &&
      typeof parsed.estimatedMinutes === 'number';

    if (!hasRequired) {
      const lesson = {
        ...fallbackLesson(topic.trim()),
        isGenerated: true as const,
        generatedAt: new Date().toISOString(),
        topic: topic.trim(),
      };
      return res.status(200).json({ lesson });
    }

    const lesson = {
      id: `generated-${Date.now()}`,
      ...parsed,
      isGenerated: true as const,
      generatedAt: new Date().toISOString(),
      topic: topic.trim(),
    };

    return res.status(200).json({ lesson });
  } catch (err: unknown) {
    console.error('[/api/generate-lesson]', err);
    const lesson = {
      ...fallbackLesson(topic.trim()),
      isGenerated: true as const,
      generatedAt: new Date().toISOString(),
      topic: topic.trim(),
    };
    return res.status(200).json({ lesson });
  }
}
