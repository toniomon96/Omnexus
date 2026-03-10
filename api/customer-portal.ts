import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import { findStripeCustomerByEmail, getStripeConfig, validateStripeCustomer } from './_stripe.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // BUG-08: Add rate limiting (was missing — portal URL creation calls Stripe API).
  if (!await checkRateLimit(req, res)) return;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Auth service not configured' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const stripeConfig = getStripeConfig({ requireAppUrl: true });
  if (stripeConfig.error || !stripeConfig.stripe) {
    console.error('[/api/customer-portal] Stripe config error:', stripeConfig.error);
    return res.status(500).json({ error: stripeConfig.error ?? 'Payment service not configured' });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? '';

    if (customerId) {
      const isValidCustomer = await validateStripeCustomer(stripeConfig.stripe, customerId);
      if (!isValidCustomer) {
        customerId = '';
      }
    }

    if (!customerId && user.email) {
      customerId = (await findStripeCustomerByEmail(stripeConfig.stripe, user.email, user.id)) ?? '';
      if (customerId) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }
    }

    if (!customerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripeConfig.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${stripeConfig.appUrl}/subscription`,
    });

    return res.status(200).json({ portalUrl: session.url });
  } catch (err) {
    console.error('[/api/customer-portal]', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
