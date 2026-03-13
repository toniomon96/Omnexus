import { afterEach, describe, expect, it } from 'vitest';
import {
  findStripeCustomerByEmail,
  getStripeConfig,
  getSubscriptionPeriodEnd,
  isStripeMissingResourceError,
  validateStripeCustomer,
} from './_stripe.js';

describe('_stripe helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('detects stripe resource missing errors', () => {
    expect(isStripeMissingResourceError({ type: 'StripeInvalidRequestError', code: 'resource_missing' })).toBe(true);
    expect(isStripeMissingResourceError({ type: 'StripeInvalidRequestError', code: 'other' })).toBe(false);
    expect(isStripeMissingResourceError(new Error('boom'))).toBe(false);
  });

  it('validates customer existence and handles missing customer', async () => {
    const stripeLike = {
      customers: {
        retrieve: async (customerId: string) => {
          if (customerId === 'missing') {
            throw { type: 'StripeInvalidRequestError', code: 'resource_missing' };
          }
          return { id: customerId, deleted: false };
        },
      },
    };

    await expect(validateStripeCustomer(stripeLike as never, 'cus_1')).resolves.toBe(true);
    await expect(validateStripeCustomer(stripeLike as never, 'missing')).resolves.toBe(false);
  });

  it('finds best customer match by metadata userId and ignores deleted customers', async () => {
    const stripeLike = {
      customers: {
        list: async () => ({
          data: [
            { id: 'cus_deleted', deleted: true, metadata: { userId: 'user_1' } },
            { id: 'cus_other', metadata: { userId: 'user_2' } },
            { id: 'cus_match', metadata: { userId: 'user_1' } },
          ],
        }),
      },
    };

    const exact = await findStripeCustomerByEmail(stripeLike as never, 'test@example.com', 'user_1');
    expect(exact).toBe('cus_match');

    const fallback = await findStripeCustomerByEmail(stripeLike as never, 'test@example.com');
    expect(fallback).toBe('cus_other');
  });

  it('returns latest subscription period end from all line items', () => {
    const subscriptionLike = {
      items: {
        data: [
          { current_period_end: 1700000000 },
          { current_period_end: 1710000000 },
        ],
      },
    };

    expect(getSubscriptionPeriodEnd(subscriptionLike as never)).toBe(new Date(1710000000 * 1000).toISOString());
  });

  it('returns config errors for invalid env combinations', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(getStripeConfig().error).toBe('STRIPE_SECRET_KEY is not configured');

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.STRIPE_PRICE_ID;
    expect(getStripeConfig({ requirePriceId: true }).error).toBe('STRIPE_PRICE_ID is not configured');

    process.env.STRIPE_PRICE_ID = 'price_123';
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(getStripeConfig({ requireWebhookSecret: true }).error).toBe('STRIPE_WEBHOOK_SECRET is not configured');

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.VERCEL_ENV = 'production';
    expect(getStripeConfig().error).toContain('Stripe test secret key');
  });

  it('returns a usable stripe config when env is valid', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PRICE_ID = 'price_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.APP_URL = 'https://example.com';

    const config = getStripeConfig({
      requirePriceId: true,
      requireWebhookSecret: true,
      requireAppUrl: true,
    });

    expect(config.error).toBeUndefined();
    expect(config.stripe).toBeTruthy();
    expect(config.priceId).toBe('price_123');
    expect(config.webhookSecret).toBe('whsec_123');
    expect(config.appUrl).toBe('https://example.com');
  });
});
