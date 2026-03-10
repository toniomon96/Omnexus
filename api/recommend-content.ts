import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { buildCacheKey, getMemoryCache, setMemoryCache } from './_cache.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecommendRequest {
  query: string;
  completedLessons?: string[];
  goals?: string[];
  experienceLevel?: string;
  limit?: number;
}

interface ContentRecommendation {
  id: string;
  title: string;
  type: 'lesson' | 'exercise' | 'course';
  courseId?: string;
  category?: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

interface RecommendResponse {
  recommendations: ContentRecommendation[];
  hasContentGap: boolean;
  gapTopic?: string;
}

const RECOMMEND_CACHE_TTL_SECONDS = 180;

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await checkRateLimit(req, res)) return;

  const {
    query,
    completedLessons = [],
    limit = 5,
  }: RecommendRequest = req.body ?? {};

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (query.length > 500) {
    return res.status(400).json({ error: 'query too long (max 500 characters)' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase env vars not configured' });

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCompleted = [...new Set(completedLessons)].sort().join(',');
  const safeLimit = Math.max(1, limit);
  const cacheKey = buildCacheKey('recommend-content', [normalizedQuery, normalizedCompleted, safeLimit]);
  const cached = getMemoryCache<RecommendResponse>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Embed the query
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    });
    const queryEmbedding = embedRes.data[0].embedding;

    // Search both tables in parallel
    const [contentResult, exerciseResult] = await Promise.all([
      supabase.rpc('match_content', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,
        match_count: 10,
      }),
      supabase.rpc('match_exercises', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,
        match_count: 5,
      }),
    ]);

    const completedSet = new Set(completedLessons);
    const recommendations: ContentRecommendation[] = [];

    // Process content results (lessons + courses)
    if (contentResult.data) {
      for (const row of contentResult.data as Array<{ id: string; type: string; metadata: Record<string, unknown>; similarity: number }>) {
        if (row.type === 'lesson' && completedSet.has(row.id)) continue;
        recommendations.push({
          id: row.id,
          title: (row.metadata.title as string) ?? row.id,
          type: row.type as 'lesson' | 'course',
          courseId: row.type === 'lesson' ? (row.metadata.courseId as string | undefined) : undefined,
          category: row.metadata.category as string | undefined,
          relevanceScore: row.similarity,
          metadata: row.metadata,
        });
      }
    }

    // Process exercise results
    if (exerciseResult.data) {
      for (const row of exerciseResult.data as Array<{ id: string; metadata: Record<string, unknown>; similarity: number }>) {
        recommendations.push({
          id: row.id,
          title: (row.metadata.name as string) ?? row.id,
          type: 'exercise',
          category: row.metadata.category as string | undefined,
          relevanceScore: row.similarity,
          metadata: row.metadata,
        });
      }
    }

    // Sort by relevance descending, apply limit
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const sliced = recommendations.slice(0, safeLimit);

    const maxSimilarity = sliced.length > 0 ? sliced[0].relevanceScore : 0;
    const hasContentGap = maxSimilarity < 0.65 || recommendations.length === 0;

    const response: RecommendResponse = {
      recommendations: sliced,
      hasContentGap,
      ...(hasContentGap ? { gapTopic: query.trim() } : {}),
    };

    setMemoryCache(cacheKey, response, RECOMMEND_CACHE_TTL_SECONDS);
    return res.status(200).json(response);
  } catch (err: unknown) {
    console.error('[/api/recommend-content]', err);
    const msg = err instanceof Error ? err.message : 'Failed to get recommendations';
    return res.status(500).json({ error: msg });
  }
}
