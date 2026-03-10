import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    setHeader() {
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
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

function createReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
    socket: { remoteAddress: '127.0.0.1' },
    query: { session_id: 'cs_test_1' },
    ...overrides,
  } as unknown as VercelRequest;
}

function createSupabaseMock(options: { authInvalid?: boolean } = {}) {
  const profileUpdates: Array<unknown> = [];
  const subscriptionUpserts: Array<unknown> = [];

  const supabaseMock = {
    auth: {
      getUser: vi.fn(async () => {
        if (options.authInvalid) {
          return { data: { user: null }, error: new Error('invalid token') };
        }
        return { data: { user: { id: 'user_1' } }, error: null };
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          update: vi.fn((payload: unknown) => {
            profileUpdates.push(payload);
            return {
              eq: vi.fn(async () => ({ data: null, error: null })),
            };
          }),
        };
      }

      if (table === 'subscriptions') {
        return {
          upsert: vi.fn(async (payload: unknown) => {
            subscriptionUpserts.push(payload);
            return { data: null, error: null };
          }),
        };
      }

      return {};
    }),
  };

  return { supabaseMock, profileUpdates, subscriptionUpserts };
}

describe('checkout-status hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('requires authentication header', async () => {
    const { supabaseMock } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({ getStripeConfig: () => ({ stripe: {}, webhookSecret: 'whsec' }) }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq({ headers: { origin: 'http://localhost:3000' } }), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Authentication required' });
  });

  it('returns 500 when stripe configuration is invalid', async () => {
    const { supabaseMock } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({ getStripeConfig: () => ({ error: 'Missing STRIPE_SECRET_KEY', stripe: null }) }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Missing STRIPE_SECRET_KEY' });
  });

  it('returns 401 when bearer token is invalid', async () => {
    const { supabaseMock } = createSupabaseMock({ authInvalid: true });

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({ getStripeConfig: () => ({ stripe: { checkout: { sessions: { retrieve: vi.fn() } } } }) }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Invalid token' });
  });

  it('returns 403 when session owner does not match authenticated user', async () => {
    const { supabaseMock } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: {
            sessions: {
              retrieve: vi.fn(async () => ({
                client_reference_id: 'other_user',
                customer: 'cus_1',
                subscription: 'sub_1',
                status: 'complete',
              })),
            },
          },
          subscriptions: { retrieve: vi.fn() },
        },
      }),
    }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(403);
    expect(getBody()).toEqual({ error: 'Checkout session does not belong to this user' });
  });

  it('returns free tier when checkout session has no subscription id', async () => {
    const { supabaseMock, profileUpdates, subscriptionUpserts } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: {
            sessions: {
              retrieve: vi.fn(async () => ({
                client_reference_id: 'user_1',
                customer: 'cus_1',
                subscription: null,
                status: 'complete',
              })),
            },
          },
          subscriptions: { retrieve: vi.fn() },
        },
      }),
    }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ tier: 'free', checkoutStatus: 'complete', synced: false });
    expect(profileUpdates).toContainEqual({ stripe_customer_id: 'cus_1' });
    expect(subscriptionUpserts).toHaveLength(0);
  });

  it('returns premium and syncs subscription for active status', async () => {
    const { supabaseMock, profileUpdates, subscriptionUpserts } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: {
            sessions: {
              retrieve: vi.fn(async () => ({
                client_reference_id: 'user_1',
                customer: 'cus_1',
                subscription: 'sub_1',
                status: 'complete',
              })),
            },
          },
          subscriptions: {
            retrieve: vi.fn(async () => ({
              id: 'sub_1',
              status: 'active',
              cancel_at_period_end: false,
              items: { data: [{ current_period_end: 1_800_000_000 }] },
            })),
          },
        },
      }),
    }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ tier: 'premium', checkoutStatus: 'complete', subscriptionStatus: 'active', synced: true });
    expect(profileUpdates).toContainEqual({ stripe_customer_id: 'cus_1' });
    expect(subscriptionUpserts).toHaveLength(1);
  });

  it('returns 500 when stripe checkout retrieval throws', async () => {
    const { supabaseMock } = createSupabaseMock();

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => supabaseMock }));
    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          checkout: {
            sessions: {
              retrieve: vi.fn(async () => {
                throw new Error('stripe timeout');
              }),
            },
          },
          subscriptions: { retrieve: vi.fn() },
        },
      }),
    }));

    const { default: checkoutStatus } = await import('./checkout-status');
    const { res, getStatusCode, getBody } = createMockResponse();

    await checkoutStatus(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Failed to reconcile checkout status' });
  });
});
