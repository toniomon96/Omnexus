import Stripe from 'stripe';

type StripeConfigOptions = {
  requirePriceId?: boolean;
  requireWebhookSecret?: boolean;
  requireAppUrl?: boolean;
};

export type StripeConfigResult = {
  stripe: Stripe | null;
  appUrl: string;
  priceId?: string;
  webhookSecret?: string;
  error?: string;
};

export function isStripeMissingResourceError(err: unknown): boolean {
  return !!err
    && typeof err === 'object'
    && 'type' in err
    && 'code' in err
    && (err as { type?: string; code?: string }).type === 'StripeInvalidRequestError'
    && (err as { type?: string; code?: string }).code === 'resource_missing';
}

export async function validateStripeCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !('deleted' in customer && customer.deleted);
  } catch (err) {
    if (isStripeMissingResourceError(err)) return false;
    throw err;
  }
}

export async function findStripeCustomerByEmail(
  stripe: Stripe,
  email: string,
  userId?: string,
): Promise<string | null> {
  const existing = await stripe.customers.list({ email, limit: 10 });
  const candidates = existing.data.filter(
    (customer) => !('deleted' in customer && (customer as Stripe.DeletedCustomer).deleted === true),
  );

  if (userId) {
    const exact = candidates.find((customer) => customer.metadata?.userId === userId);
    if (exact) return exact.id;
  }

  return candidates[0]?.id ?? null;
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number');

  if (itemPeriodEnds.length === 0) return null;

  return new Date(Math.max(...itemPeriodEnds) * 1000).toISOString();
}

export async function findStripeSubscription(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const active = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
  if (active.data[0]) return active.data[0];

  const trialing = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });
  return trialing.data[0] ?? null;
}

function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function isTestSecretKey(secretKey: string): boolean {
  return secretKey.startsWith('sk_test_');
}

function isLocalAppUrl(appUrl: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(appUrl);
}

export function getStripeConfig(options: StripeConfigOptions = {}): StripeConfigResult {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  const priceId = process.env.STRIPE_PRICE_ID?.trim() ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').trim();

  if (!secretKey) {
    return {
      stripe: null,
      appUrl,
      error: 'STRIPE_SECRET_KEY is not configured',
    };
  }

  if (options.requirePriceId && !priceId) {
    return {
      stripe: null,
      appUrl,
      error: 'STRIPE_PRICE_ID is not configured',
    };
  }

  if (options.requireWebhookSecret && !webhookSecret) {
    return {
      stripe: null,
      appUrl,
      error: 'STRIPE_WEBHOOK_SECRET is not configured',
    };
  }

  if (isProductionDeployment() && isTestSecretKey(secretKey)) {
    return {
      stripe: null,
      appUrl,
      error: 'Production deployment is using a Stripe test secret key. Set STRIPE_SECRET_KEY to your live sk_live_ key.',
    };
  }

  if (isProductionDeployment() && options.requireAppUrl && isLocalAppUrl(appUrl)) {
    return {
      stripe: null,
      appUrl,
      error: 'APP_URL points to localhost in production. Set APP_URL to your public https:// app URL.',
    };
  }

  return {
    stripe: new Stripe(secretKey),
    appUrl,
    priceId: priceId || undefined,
    webhookSecret: webhookSecret || undefined,
  };
}