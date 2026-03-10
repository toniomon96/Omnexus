import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { setCorsHeaders } from './_cors.js';
import { getStripeConfig } from './_stripe.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number');

  if (itemPeriodEnds.length === 0) return null;

  return new Date(Math.max(...itemPeriodEnds) * 1000).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Auth service not configured' });
  }

  const stripeConfig = getStripeConfig();
  if (stripeConfig.error || !stripeConfig.stripe) {
    console.error('[/api/checkout-status] Stripe config error:', stripeConfig.error);
    return res.status(500).json({ error: stripeConfig.error ?? 'Stripe not configured' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id.trim() : '';
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const checkoutSession = await stripeConfig.stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.client_reference_id !== user.id) {
      return res.status(403).json({ error: 'Checkout session does not belong to this user' });
    }

    if (checkoutSession.customer) {
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: checkoutSession.customer as string })
        .eq('id', user.id);
    }

    if (typeof checkoutSession.subscription !== 'string') {
      return res.status(200).json({
        tier: 'free',
        checkoutStatus: checkoutSession.status,
        synced: false,
      });
    }

    const subscription = await stripeConfig.stripe.subscriptions.retrieve(checkoutSession.subscription);
    const periodEnd = getSubscriptionPeriodEnd(subscription);

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: (checkoutSession.customer as string) ?? '',
        status: subscription.status,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return res.status(200).json({
      tier: subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free',
      checkoutStatus: checkoutSession.status,
      subscriptionStatus: subscription.status,
      synced: true,
    });
  } catch (err) {
    console.error('[/api/checkout-status]', err);
    return res.status(500).json({ error: 'Failed to reconcile checkout status' });
  }
}