import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
    end() {
      return res;
    },
    send(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeader: (name: string) => headers.get(name),
  };
}

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { origin: 'http://localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as VercelRequest;
}

describe('billing routes baseline guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('create-checkout rejects non-POST methods', async () => {
    const { default: createCheckout } = await import('./create-checkout.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await createCheckout(createReq({ method: 'GET' }), res);

    expect(getStatusCode()).toBe(405);
    expect(getBody()).toEqual({ error: 'Method not allowed' });
  });

  it('create-checkout requires authentication', async () => {
    const { default: createCheckout } = await import('./create-checkout.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await createCheckout(createReq({ method: 'POST', headers: { origin: 'http://localhost:3000' } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('create-checkout fails when auth service is not configured', async () => {
    const { default: createCheckout } = await import('./create-checkout.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await createCheckout(
      createReq({ method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer fake-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Auth service not configured' });
  });

  it('customer-portal rejects non-POST methods', async () => {
    const { default: customerPortal } = await import('./customer-portal.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await customerPortal(createReq({ method: 'GET' }), res);

    expect(getStatusCode()).toBe(405);
    expect(getBody()).toEqual({ error: 'Method not allowed' });
  });

  it('customer-portal requires authentication', async () => {
    const { default: customerPortal } = await import('./customer-portal.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await customerPortal(createReq({ method: 'POST', headers: { origin: 'http://localhost:3000' } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('customer-portal fails when auth service is not configured', async () => {
    const { default: customerPortal } = await import('./customer-portal.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await customerPortal(
      createReq({ method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer fake-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Auth service not configured' });
  });

  it('subscription-status rejects non-GET methods', async () => {
    const { default: subscriptionStatus } = await import('./subscription-status.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await subscriptionStatus(createReq({ method: 'POST' }), res);

    expect(getStatusCode()).toBe(405);
    expect(getBody()).toEqual({ error: 'Method not allowed' });
  });

  it('subscription-status requires authentication', async () => {
    const { default: subscriptionStatus } = await import('./subscription-status.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await subscriptionStatus(createReq({ method: 'GET', headers: { origin: 'http://localhost:3000' } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('subscription-status fails when auth service is not configured', async () => {
    const { default: subscriptionStatus } = await import('./subscription-status.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await subscriptionStatus(
      createReq({ method: 'GET', headers: { origin: 'http://localhost:3000', authorization: 'Bearer fake-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Auth service not configured' });
  });

  it('create-checkout returns alreadyPremium when active subscription exists in DB', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1', email: 'user@example.com' } }, error: null })),
      },
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { stripe_subscription_id: 'sub_1', status: 'active' },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        return {};
      }),
    };

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({ stripe: {}, priceId: 'price_1', appUrl: 'http://localhost:3000' }),
    }));

    const { default: createCheckout } = await import('./create-checkout.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await createCheckout(
      createReq({ method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(409);
    expect(getBody()).toEqual({ error: 'Premium is already active for this account', alreadyPremium: true });
  });

  it('create-checkout creates checkout session and persists resolved customer id', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const profileUpdates: Array<unknown> = [];

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1', email: 'user@example.com' } }, error: null })),
      },
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
            })),
            upsert: vi.fn(async () => ({ data: null, error: null })),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { stripe_customer_id: null }, error: null })),
              })),
            })),
            update: vi.fn((payload: unknown) => {
              profileUpdates.push(payload);
              return {
                eq: vi.fn(async () => ({ data: null, error: null })),
              };
            }),
          };
        }

        return {};
      }),
    };

    const checkoutCreate = vi.fn(async () => ({ url: 'https://checkout.stripe.test/session_1' }));

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: { sessions: { create: checkoutCreate } },
        },
        priceId: 'price_1',
        appUrl: 'http://localhost:3000',
      }),
      findStripeCustomerByEmail: vi.fn(async () => 'cus_found_1'),
      findStripeSubscription: vi.fn(async () => null),
      validateStripeCustomer: vi.fn(async () => true),
      getSubscriptionPeriodEnd: vi.fn(() => null),
      isStripeMissingResourceError: vi.fn(() => false),
    }));

    const { default: createCheckout } = await import('./create-checkout.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await createCheckout(
      createReq({ method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ sessionUrl: 'https://checkout.stripe.test/session_1' });
    expect(profileUpdates).toContainEqual({ stripe_customer_id: 'cus_found_1' });
    expect(checkoutCreate).toHaveBeenCalledTimes(1);
  });

  it('customer-portal returns 404 when no customer can be resolved', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1', email: 'user@example.com' } }, error: null })),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { stripe_customer_id: null }, error: null })),
              })),
            })),
            update: vi.fn(() => ({ eq: vi.fn(async () => ({ data: null, error: null })) })),
          };
        }

        return {};
      }),
    };

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({ stripe: { billingPortal: { sessions: { create: vi.fn() } } }, appUrl: 'http://localhost:3000' }),
      findStripeCustomerByEmail: vi.fn(async () => null),
      validateStripeCustomer: vi.fn(async () => true),
    }));

    const { default: customerPortal } = await import('./customer-portal.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await customerPortal(
      createReq({ method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(404);
    expect(getBody()).toEqual({ error: 'No subscription found' });
  });

  it('subscription-status reconciles Stripe subscription and returns premium limits', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const subscriptionUpserts: Array<unknown> = [];

    const supabaseMock = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user_1', email: 'user@example.com' } }, error: null })),
      },
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
            })),
            upsert: vi.fn(async (payload: unknown) => {
              subscriptionUpserts.push(payload);
              return { data: null, error: null };
            }),
          };
        }

        if (table === 'user_ai_usage') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: { ask_count: 2 }, error: null })),
                })),
                gte: vi.fn(() => ({
                  lte: vi.fn(async () => ({ data: [{ date: '2026-03-01', program_gen_count: 1 }], error: null })),
                })),
              })),
            })),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { stripe_customer_id: 'cus_1' }, error: null })),
              })),
            })),
            update: vi.fn(() => ({ eq: vi.fn(async () => ({ data: null, error: null })) })),
          };
        }

        return {};
      }),
    };

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({ stripe: {} }),
      validateStripeCustomer: vi.fn(async () => true),
      findStripeCustomerByEmail: vi.fn(async () => null),
      findStripeSubscription: vi.fn(async () => ({
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: false,
      })),
      getSubscriptionPeriodEnd: vi.fn(() => '2026-04-01T00:00:00.000Z'),
    }));

    const { default: subscriptionStatus } = await import('./subscription-status.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await subscriptionStatus(
      createReq({ method: 'GET', headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' } }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toMatchObject({
      tier: 'premium',
      askCount: 2,
      askLimit: 999,
      programGenCount: 1,
      programGenLimit: 5,
    });
    expect(subscriptionUpserts.length).toBe(1);
  });
});
