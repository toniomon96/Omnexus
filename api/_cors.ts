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

function getHost(req: VercelRequest): string | null {
  const host = req.headers.host;
  if (!host) return null;
  const value = Array.isArray(host) ? host[0] : host;
  return value.trim().toLowerCase();
}

function isSameHostOrigin(origin: string, host: string): boolean {
  try {
    const originUrl = new URL(origin);
    return originUrl.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function getHostFromOrigin(origin: string): string | null {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedHost(host: string, allowedOrigins: Set<string>): boolean {
  for (const allowedOrigin of allowedOrigins) {
    if (getHostFromOrigin(allowedOrigin) === host) return true;
  }
  return false;
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
  const vercelEnv = process.env.VERCEL_ENV;
  const isPreview = vercelEnv === 'preview';
  const isProduction = vercelEnv === 'production' || (process.env.NODE_ENV === 'production' && !vercelEnv);

  if (isPreview) {
    const host = getHost(req);
    const allowedOrigins = getProdAllowedOrigins();
    if (!origin) {
      // Same-origin requests may omit Origin header; allow trusted preview hosts.
      if (host && (host.endsWith('.vercel.app') || isAllowedHost(host, allowedOrigins))) {
        return true;
      }
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }

    if (origin && ((host && isSameHostOrigin(origin, host)) || allowedOrigins.has(origin))) {
      applyCommonCorsHeaders(res, origin);
      return true;
    }

    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  if (isProduction) {
    const allowedOrigins = getProdAllowedOrigins();
    if (!origin) {
      const host = getHost(req);
      if (host && isAllowedHost(host, allowedOrigins)) {
        return true;
      }
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }

    if (!allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    applyCommonCorsHeaders(res, origin);
    return true;
  }

  applyCommonCorsHeaders(res, origin ?? '*');
  return true;
}
