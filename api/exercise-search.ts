import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { hasPromptInjectionSignals, sanitizeFreeText } from './_aiSafety.js';

// ─── Module-level clients (reused across warm invocations) ────────────────────

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_QUERY_LENGTH = 200;
const MATCH_THRESHOLD = 0.3;
const MATCH_COUNT = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseRow {
  id: string;
  metadata: { name?: string };
  similarity: number;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:exercise-search', limit: 30, window: '10 m' })) return;

  // ── Validate input ────────────────────────────────────────────────────────

  const rawQuery = req.body?.query;
  const query = sanitizeFreeText(rawQuery, MAX_QUERY_LENGTH);

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (hasPromptInjectionSignals(query)) {
    return res.status(400).json({ error: 'Invalid query' });
  }

  // ── Degraded path — return early if infrastructure is unavailable ─────────

  if (!openai || !supabaseAdmin) {
    return res.status(200).json({ ids: [], degraded: true });
  }

  // ── Embed the query and search ────────────────────────────────────────────

  try {
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embedding = embedRes.data[0].embedding;

    const { data, error } = await supabaseAdmin.rpc('match_exercises', {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
    });

    if (error) {
      return res.status(200).json({ ids: [], degraded: true });
    }

    const rows = (data ?? []) as ExerciseRow[];
    const ids = rows
      .sort((a, b) => b.similarity - a.similarity)
      .map((row) => row.id);

    return res.status(200).json({ ids });
  } catch {
    return res.status(200).json({ ids: [], degraded: true });
  }
}
