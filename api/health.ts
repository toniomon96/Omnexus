import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint.
 *
 * Returns 200 with a JSON payload describing the presence of required
 * environment variables. Sensitive values are never exposed — only
 * whether the variable is set or not.
 *
 * Stripe dashboard: point the webhook URL to:
 *   https://omnexus.fit/api/webhook-stripe
 * (NOT to the root domain)
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const checks = {
    anthropicApiKey: !!process.env.ANTHROPIC_API_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceId: !!process.env.STRIPE_PRICE_ID,
    supabaseUrl: !!process.env.VITE_SUPABASE_URL,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.APP_URL ?? '(not set)',
    vercelEnv: process.env.VERCEL_ENV ?? '(not set)',
  };

  const missing = Object.entries(checks)
    .filter(([k, v]) => k !== 'appUrl' && k !== 'vercelEnv' && v === false)
    .map(([k]) => k);

  const status = missing.length === 0 ? 'ok' : 'degraded';

  return res.status(200).json({
    status,
    missing,
    checks,
    webhookEndpoint: '/api/webhook-stripe',
    ts: new Date().toISOString(),
  });
}
