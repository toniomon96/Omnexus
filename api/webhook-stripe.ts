import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!stripe || !WEBHOOK_SECRET) {
    console.warn('[webhook-stripe] Stripe not configured — ignoring webhook');
    return res.status(200).json({ received: true });
  }

  if (!supabaseAdmin) {
    console.error('[webhook-stripe] Supabase admin not configured');
    return res.status(500).json({ error: 'DB not configured' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook-stripe] Signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }

  try {
    switch (event.type) {
      // BUG-01: Handle checkout.session.completed as the authoritative provisioning event.
      // customer.subscription.created may fire before create-checkout.ts has persisted
      // stripe_customer_id to profiles, causing the profile lookup below to return null.
      // client_reference_id (= user.id) is always set by create-checkout.ts and lets us
      // provision the subscription without relying on the profiles.stripe_customer_id lookup.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;

        if (!userId) {
          console.warn('[webhook-stripe] checkout.session.completed: missing client_reference_id');
          break;
        }

        // Ensure stripe_customer_id is stored (may not have been saved in the race window).
        if (customerId) {
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        }

        // Provision the subscription row immediately from the session data.
        if (typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          await supabaseAdmin.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              status: sub.status,
              current_period_end: periodEnd,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Find user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!profile) {
          console.warn('[webhook-stripe] No profile found for customer:', customerId);
          break;
        }

        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: profile.id,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            status: sub.status,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }

      default:
        // Unhandled event types are fine — Stripe sends many event types
        break;
    }
  } catch (err) {
    console.error('[webhook-stripe] Handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.status(200).json({ received: true });
}
