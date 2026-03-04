import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, ALLOWED_ORIGIN } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// BUG-06: Use APP_URL (server-side env var), not VITE_APP_URL (Vite inlines VITE_ vars at build
// time — they are NOT available in Vercel serverless functions at runtime).
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ALLOWED_ORIGIN);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  if (!stripe) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  // BUG-07: Always use the server-side price ID — never trust a client-supplied priceId.
  const resolvedPriceId = process.env.STRIPE_PRICE_ID;
  if (!resolvedPriceId) {
    return res.status(500).json({ error: 'Payment not configured' });
  }

  try {
    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId: string = profile?.stripe_customer_id ?? '';

    if (!customerId) {
      // BUG-05: Check for an existing Stripe customer before creating to avoid orphans.
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
      }

      // Persist the customer ID — log on failure but don't abort; the
      // checkout.session.completed webhook will also attempt to save it.
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      if (updateError) {
        console.error('[/api/create-checkout] Failed to save stripe_customer_id:', updateError);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      // BUG-01: client_reference_id lets the webhook find the user by ID even if
      // stripe_customer_id hasn't been persisted to profiles yet (race condition).
      client_reference_id: user.id,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/subscription?success=true`,
      cancel_url: `${APP_URL}/subscription`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ sessionUrl: session.url });
  } catch (err) {
    console.error('[/api/create-checkout]', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
