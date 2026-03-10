import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROD_ALLOWED_ORIGINS = new Set([
  'https://omnexus.netlify.app',
  'https://fitness-app-ten-eta.vercel.app',
]);

function getOrigin(req: VercelRequest): string | null {
  const origin = req.headers.origin;
  if (!origin) return null;
  return Array.isArray(origin) ? origin[0] : origin;
}

function applyCommonCorsHeaders(res: VercelResponse, origin: string): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Vary', 'Origin');
}

/**
 * Applies CORS headers and enforces a strict origin allowlist in production.
 * Returns false when the request must be blocked.
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = getOrigin(req);
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!origin || !PROD_ALLOWED_ORIGINS.has(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    applyCommonCorsHeaders(res, origin);
    return true;
  }

  applyCommonCorsHeaders(res, origin ?? '*');
  return true;
}
