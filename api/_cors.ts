import type { VercelResponse } from '@vercel/node';

/**
 * Shared CORS helper.
 *
 * REQUIRED in production: set ALLOWED_ORIGIN in Vercel environment settings
 * to your frontend URL, e.g. https://your-app.vercel.app
 *
 * Falls back to '*' only in local development (NODE_ENV !== 'production').
 * In production without ALLOWED_ORIGIN set, a warning is logged so it's
 * visible in Vercel function logs.
 */
const envOrigin = process.env.ALLOWED_ORIGIN;
if (!envOrigin && process.env.NODE_ENV === 'production') {
  console.warn('[CORS] ALLOWED_ORIGIN is not set in production — defaulting to wildcard. Set ALLOWED_ORIGIN in Vercel environment settings.');
}
export const ALLOWED_ORIGIN = envOrigin ?? '*';

export function setCorsHeaders(res: VercelResponse, origin = '*'): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
