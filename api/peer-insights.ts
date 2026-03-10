import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { buildCacheKey, getMemoryCache, setMemoryCache } from './_cache.js';

const SYSTEM_PROMPT = `You are a fitness coach providing encouraging peer comparison insights.

You will receive anonymized aggregate statistics about other users with the same goal and experience level as the current user.

Write 2-3 sentences that:
1. Acknowledge what the peer group is doing on average (volume, frequency)
2. Gently encourage the user to see how they compare or where they can grow
3. End with a motivating note

Be encouraging, not judgmental. Use specific numbers from the data. Never mention individual users.
Output plain text only (no markdown, no bullet points).`;

const MIN_PEERS = 3;
const PEER_INSIGHTS_CACHE_TTL_SECONDS = 180;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
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

  const { goal, experienceLevel } = req.body ?? {};
  const cacheKey = buildCacheKey('peer-insights', [goal ?? 'general-fitness', experienceLevel ?? 'beginner']);
  const cached = getMemoryCache<{ narrative: string; peerCount: number; hasEnoughPeers: boolean }>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  // Find peer user IDs with same goal + experience level from profiles/training_profiles
  // We aggregate workout data without ever passing individual records to Claude
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let peerCount: number;
  let narrative: string;

  try {
    // Get users with matching goal+level from training_profiles, filtered at DB level
    let peersQuery = supabaseAdmin
      .from('training_profiles')
      .select('user_id')
      .neq('user_id', userId);

    if (goal) {
      peersQuery = peersQuery.contains('goals', [goal]);
    }

    const { data: peerProfiles } = await peersQuery;

    const peerIds = (peerProfiles ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.user_id as string)
      .filter(Boolean);

    if (peerIds.length < MIN_PEERS) {
      const payload = { narrative: '', peerCount: peerIds.length, hasEnoughPeers: false };
      setMemoryCache(cacheKey, payload, PEER_INSIGHTS_CACHE_TTL_SECONDS);
      return res.status(200).json(payload);
    }

    // Aggregate workout stats for peers in last 30 days
    const { data: sessions } = await supabaseAdmin
      .from('workout_sessions')
      .select('user_id, total_volume_kg, started_at')
      .in('user_id', peerIds)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .not('completed_at', 'is', null);

    peerCount = peerIds.length;

    if (!sessions || sessions.length === 0) {
      const payload = { narrative: '', peerCount, hasEnoughPeers: false };
      setMemoryCache(cacheKey, payload, PEER_INSIGHTS_CACHE_TTL_SECONDS);
      return res.status(200).json(payload);
    }

    // Calculate aggregate metrics (only aggregates — no individual data passed to Claude)
    const sessionsByUser: Record<string, { volume: number; count: number }> = {};
    for (const s of sessions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = s as any;
      if (!sessionsByUser[row.user_id]) {
        sessionsByUser[row.user_id] = { volume: 0, count: 0 };
      }
      sessionsByUser[row.user_id].volume += row.total_volume_kg ?? 0;
      sessionsByUser[row.user_id].count += 1;
    }

    const userStats = Object.values(sessionsByUser);
    const activeUsers = userStats.length;

    if (activeUsers < MIN_PEERS) {
      const payload = { narrative: '', peerCount, hasEnoughPeers: false };
      setMemoryCache(cacheKey, payload, PEER_INSIGHTS_CACHE_TTL_SECONDS);
      return res.status(200).json(payload);
    }

    const avgWeeklySessions = (userStats.reduce((s, u) => s + u.count, 0) / activeUsers / 4.3).toFixed(1);
    const avgWeeklyVolume = Math.round(userStats.reduce((s, u) => s + u.volume, 0) / activeUsers / 4.3);

    const aggregateContext = [
      `Peer group: ${activeUsers} users with goal="${goal ?? 'general fitness'}", level="${experienceLevel ?? 'beginner'}" (last 30 days)`,
      `Average sessions per week: ${avgWeeklySessions}`,
      `Average weekly volume: ${avgWeeklyVolume} kg`,
    ].join('\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: aggregateContext }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');
    narrative = block.text.trim();
  } catch (err) {
    console.error('[/api/peer-insights]', err);
    return res.status(500).json({ error: 'Failed to generate peer insights' });
  }

  const payload = { narrative, peerCount, hasEnoughPeers: true };
  setMemoryCache(cacheKey, payload, PEER_INSIGHTS_CACHE_TTL_SECONDS);
  return res.status(200).json(payload);
}
