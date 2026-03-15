import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripeConfig } from './_stripe.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export const config = { api: { bodyParser: false } };

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number');

  if (itemPeriodEnds.length === 0) return null;

  return new Date(Math.max(...itemPeriodEnds) * 1000).toISOString();
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionRef) return null;
  return typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id;
}

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

  const stripeConfig = getStripeConfig({ requireWebhookSecret: true });
  if (stripeConfig.error || !stripeConfig.stripe || !stripeConfig.webhookSecret) {
    console.error('[webhook-stripe] Stripe config error:', stripeConfig.error);
    return res.status(500).json({ error: stripeConfig.error ?? 'Stripe not configured' });
  }

  if (!supabaseAdmin) {
    console.error('[webhook-stripe] Supabase admin not configured');
    return res.status(500).json({ error: 'DB not configured' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripeConfig.stripe.webhooks.constructEvent(rawBody, sig, stripeConfig.webhookSecret);
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
          const sub = await stripeConfig.stripe.subscriptions.retrieve(session.subscription);
          const periodEnd = getSubscriptionPeriodEnd(sub);
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

        const periodEnd = getSubscriptionPeriodEnd(sub);

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
        const subId = getInvoiceSubscriptionId(invoice);
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
    // Log the error but still return 200 so Stripe does not keep retrying for
    // transient failures (e.g. DB timeouts). The event is recorded in Stripe
    // and can be manually replayed if needed.
    console.error('[webhook-stripe] Handler error — returned 200 to prevent Stripe retries:', err);
  }

  return res.status(200).json({ received: true });
}
