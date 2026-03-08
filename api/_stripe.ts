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