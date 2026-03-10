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

const ratelimitInstances = new Map<string, RatelimitInstance | null>();

interface RateLimitConfig {
  namespace: string;
  limit: number;
  window: `${number} m` | `${number} s` | `${number} h`;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  namespace: 'omnexus_rl:default',
  limit: 20,
  window: '10 m',
};

async function getRatelimit(config: RateLimitConfig): Promise<RatelimitInstance | null> {
  if (ratelimitInstances.has(config.namespace)) {
    return ratelimitInstances.get(config.namespace) ?? null;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    ratelimitInstances.set(config.namespace, null);
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');
    const redis = new Redis({ url, token });
    const instance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: config.namespace,
    });
    ratelimitInstances.set(config.namespace, instance);
  } catch {
    ratelimitInstances.set(config.namespace, null);
  }

  return ratelimitInstances.get(config.namespace) ?? null;
}

/**
 * Check rate limit for the incoming request.
 * Returns `true` if the request is allowed to proceed, `false` if it was blocked
 * (the 429 response has already been sent in that case).
 */
export async function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: Partial<RateLimitConfig> = {},
): Promise<boolean> {
  const resolvedConfig: RateLimitConfig = {
    namespace: config.namespace ?? DEFAULT_RATE_LIMIT.namespace,
    limit: config.limit ?? DEFAULT_RATE_LIMIT.limit,
    window: config.window ?? DEFAULT_RATE_LIMIT.window,
  };

  const isProduction = process.env.VERCEL_ENV === 'production';
  const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isProduction && !hasUpstashConfig) {
    res.status(500).json({ error: 'Rate limiting is not configured' });
    return false;
  }

  const rl = await getRatelimit(resolvedConfig);
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
