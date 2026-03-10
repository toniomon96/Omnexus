import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_PROD_ALLOWED_ORIGINS = new Set([
  'https://omnexus.netlify.app',
  'https://fitness-app-ten-eta.vercel.app',
]);

function tryGetOrigin(urlLike?: string): string | null {
  if (!urlLike) return null;
  try {
    return new URL(urlLike).origin;
  } catch {
    return null;
  }
}

function parseEnvOrigins(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => tryGetOrigin(part) ?? part)
    .filter((part) => /^https?:\/\//.test(part));
}

function getProdAllowedOrigins(): Set<string> {
  const origins = new Set<string>(DEFAULT_PROD_ALLOWED_ORIGINS);

  for (const origin of parseEnvOrigins(process.env.ALLOWED_ORIGINS)) {
    origins.add(origin);
  }

  for (const origin of parseEnvOrigins(process.env.ALLOWED_ORIGIN)) {
    origins.add(origin);
  }

  const appUrlOrigin = tryGetOrigin(process.env.APP_URL);
  if (appUrlOrigin) origins.add(appUrlOrigin);

  const apiBaseOrigin = tryGetOrigin(process.env.VITE_API_BASE_URL);
  if (apiBaseOrigin) origins.add(apiBaseOrigin);

  return origins;
}

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
    const allowedOrigins = getProdAllowedOrigins();
    if (!origin || !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    applyCommonCorsHeaders(res, origin);
    return true;
  }

  applyCommonCorsHeaders(res, origin ?? '*');
  return true;
}
