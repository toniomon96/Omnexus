import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, ALLOWED_ORIGIN } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';
import {
  findStripeCustomerByEmail,
  findStripeSubscription,
  getStripeConfig,
  getSubscriptionPeriodEnd,
  validateStripeCustomer,
} from './_stripe.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

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

  const stripeConfig = getStripeConfig({ requirePriceId: true, requireAppUrl: true });
  if (stripeConfig.error || !stripeConfig.stripe || !stripeConfig.priceId) {
    console.error('[/api/create-checkout] Stripe config error:', stripeConfig.error);
    return res.status(500).json({ error: stripeConfig.error ?? 'Payment service not configured' });
  }

  try {
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (existingSubscription) {
      return res.status(409).json({ error: 'Premium is already active for this account', alreadyPremium: true });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId: string = profile?.stripe_customer_id ?? '';

    if (customerId) {
      const isValidCustomer = await validateStripeCustomer(stripeConfig.stripe, customerId);
      if (!isValidCustomer) {
        customerId = '';
      }
    }

    if (!customerId) {
      const existingCustomerId = await findStripeCustomerByEmail(
        stripeConfig.stripe,
        user.email ?? '',
        user.id,
      );

      if (existingCustomerId) {
        customerId = existingCustomerId;
      } else {
        const customer = await stripeConfig.stripe.customers.create({
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

    const stripeSubscription = await findStripeSubscription(stripeConfig.stripe, customerId);
    if (stripeSubscription) {
      await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: user.id,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: customerId,
          status: stripeSubscription.status,
          current_period_end: getSubscriptionPeriodEnd(stripeSubscription),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      return res.status(409).json({ error: 'Premium is already active for this account', alreadyPremium: true });
    }

    const session = await stripeConfig.stripe.checkout.sessions.create({
      customer: customerId,
      // BUG-01: client_reference_id lets the webhook find the user by ID even if
      // stripe_customer_id hasn't been persisted to profiles yet (race condition).
      client_reference_id: user.id,
      line_items: [{ price: stripeConfig.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${stripeConfig.appUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${stripeConfig.appUrl}/subscription`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ sessionUrl: session.url });
  } catch (err) {
    console.error('[/api/create-checkout]', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
