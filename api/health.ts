import type { VercelRequest, VercelResponse } from '@vercel/node';

const REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  const status = missing.length === 0 ? 'ok' : 'degraded';

  if (missing.length > 0) {
    console.warn('[/api/health] Missing environment variables:', missing.join(', '));
  }

  return res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    ...(missing.length > 0 && { missingEnvVars: missing }),
  });
}
