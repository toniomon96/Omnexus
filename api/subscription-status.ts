import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
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

const FREE_ASK_LIMIT = 5;
const FREE_PROGRAM_LIMIT = 1;
const PREMIUM_PROGRAM_LIMIT = 5;
const PREMIUM_ASK_LIMIT = 999;

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

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 8)}01`;

    const [{ data: sub }, { data: askUsage }, { data: monthProgramUsage }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabaseAdmin
        .from('user_ai_usage')
        .select('ask_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
      supabaseAdmin
        .from('user_ai_usage')
        .select('date, program_gen_count')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', today),
      supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    let activeSub = sub;

    if (!activeSub) {
      const stripeConfig = getStripeConfig();
      if (stripeConfig.stripe) {
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

        if (customerId) {
          const stripeSubscription = await findStripeSubscription(stripeConfig.stripe, customerId);
          if (stripeSubscription) {
            const reconciled = {
              status: stripeSubscription.status,
              current_period_end: getSubscriptionPeriodEnd(stripeSubscription),
              cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            };

            await supabaseAdmin.from('subscriptions').upsert(
              {
                user_id: user.id,
                stripe_subscription_id: stripeSubscription.id,
                stripe_customer_id: customerId,
                status: stripeSubscription.status,
                current_period_end: reconciled.current_period_end,
                cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            );

            activeSub = reconciled;
          }
        }
      }
    }

    const isPremium = !!activeSub;
    const monthProgramCount = (monthProgramUsage ?? []).reduce((sum, row) => sum + (row.program_gen_count ?? 0), 0);

    return res.status(200).json({
      tier: isPremium ? 'premium' : 'free',
      periodEnd: activeSub?.current_period_end ?? null,
      cancelAtPeriodEnd: activeSub?.cancel_at_period_end ?? false,
      askCount: askUsage?.ask_count ?? 0,
      askLimit: isPremium ? PREMIUM_ASK_LIMIT : FREE_ASK_LIMIT,
      programGenCount: monthProgramCount,
      programGenLimit: isPremium ? PREMIUM_PROGRAM_LIMIT : FREE_PROGRAM_LIMIT,
    });
  } catch (err) {
    console.error('[/api/subscription-status]', err);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}
