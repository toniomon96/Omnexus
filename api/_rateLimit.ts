import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * IP-based rate limiting using Upstash Redis.
 *
 * Set these environment variables in Vercel (and .env.local for dev):
 *   UPSTASH_REDIS_REST_URL   — from Upstash console
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash console
 *
 * In development, missing vars disable rate limiting to keep local workflows simple.
 * In production, missing vars fail closed with HTTP 500.
 */

// Dynamic imports keep the bundle small when rate limiting is disabled.
type RatelimitInstance = { limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };

let ratelimitInstance: RatelimitInstance | null = null;

async function getRatelimit(): Promise<RatelimitInstance | null> {
  if (ratelimitInstance !== undefined) return ratelimitInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    ratelimitInstance = null;
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');
    const redis = new Redis({ url, token });
    ratelimitInstance = new Ratelimit({
      redis,
      // Sliding window: 20 AI requests per IP per 10 minutes
      limiter: Ratelimit.slidingWindow(20, '10 m'),
      prefix: 'omnexus_rl',
    });
  } catch {
    ratelimitInstance = null;
  }

  return ratelimitInstance;
}

/**
 * Check rate limit for the incoming request.
 * Returns `true` if the request is allowed to proceed, `false` if it was blocked
 * (the 429 response has already been sent in that case).
 */
export async function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isProduction && !hasUpstashConfig) {
    res.status(500).json({ error: 'Rate limiting is not configured' });
    return false;
  }

  const rl = await getRatelimit();
  if (!rl) return true; // Development fallback only (production handled above)

  // Use the real IP from Vercel's forwarded header
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      .trim() ??
    req.socket?.remoteAddress ??
    'unknown';

  const { success, limit, remaining, reset } = await rl.limit(ip);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(reset));

  if (!success) {
    res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
    return false;
  }

  return true;
}
