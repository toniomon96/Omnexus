import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type MockSupabase = {
  from: ReturnType<typeof vi.fn>;
};

function createMockResponse() {
  let statusCode = 200;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
}

function createWebhookReq(body = '{}', signature = 'sig_test'): VercelRequest {
  const listeners: Record<string, ((chunk?: Buffer) => void) | undefined> = {};

  const req = {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
    },
    on(event: string, callback: (chunk?: Buffer) => void) {
      listeners[event] = callback;
      if (event === 'end') {
        process.nextTick(() => {
          listeners.data?.(Buffer.from(body));
          listeners.end?.();
        });
      }
      return req;
    },
  } as unknown as VercelRequest;

  return req;
}

function createSupabaseMock(profileId: string | null = 'user_1') {
  const updates: Array<{ table: string; payload: unknown }> = [];
  const upserts: Array<{ table: string; payload: unknown }> = [];

  const supabase: MockSupabase = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: profileId ? { id: profileId } : null, error: null })),
        })),
      })),
      update: vi.fn((payload: unknown) => {
        updates.push({ table, payload });
        return {
          eq: vi.fn(async () => ({ data: null, error: null })),
        };
      }),
      upsert: vi.fn(async (payload: unknown) => {
        upserts.push({ table, payload });
        return { data: null, error: null };
      }),
    })),
  };

  return { supabase, updates, upserts };
}

function createSupabaseMockWithUpsertError(message = 'db upsert failed') {
  const updates: Array<{ table: string; payload: unknown }> = [];

  const supabase: MockSupabase = {
    from: vi.fn((table: string) => ({
      update: vi.fn((payload: unknown) => {
        updates.push({ table, payload });
        return {
          eq: vi.fn(async () => ({ data: null, error: null })),
        };
      }),
      upsert: vi.fn(async () => {
        throw new Error(message);
      }),
    })),
  };

  return { supabase, updates };
}

describe('stripe webhook handler', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 405 for non-POST methods', async () => {
    const { supabase } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: { webhooks: { constructEvent: vi.fn() } },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler({ method: 'GET' } as VercelRequest, res);

    expect(getStatusCode()).toBe(405);
    expect(getBody()).toEqual({ error: 'Method not allowed' });
  });

  it('returns 400 when signature verification fails', async () => {
    const { supabase } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: {
            constructEvent: vi.fn(() => {
              throw new Error('bad signature');
            }),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_1"}'), res);

    expect(getStatusCode()).toBe(400);
    expect(getBody()).toEqual({ error: 'Webhook signature invalid' });
  });

  it('returns 500 when stripe webhook configuration is invalid', async () => {
    const { supabase } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        error: 'Missing STRIPE_WEBHOOK_SECRET',
        stripe: null,
        webhookSecret: null,
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_bad_config"}'), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  });

  it('provisions subscription on checkout.session.completed', async () => {
    const { supabase, updates, upserts } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const constructEvent = vi.fn(() => ({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'user_1',
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: { constructEvent },
          subscriptions: {
            retrieve: vi.fn(async () => ({
              id: 'sub_123',
              status: 'active',
              cancel_at_period_end: false,
              items: { data: [{ current_period_end: 1_800_000_000 }] },
            })),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_checkout"}'), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ received: true });
    expect(updates.some((entry) => entry.table === 'profiles')).toBe(true);
    expect(upserts.some((entry) => entry.table === 'subscriptions')).toBe(true);
  });

  it('marks subscription as past_due on invoice payment failure', async () => {
    const { supabase, updates } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: {
            constructEvent: vi.fn(() => ({
              type: 'invoice.payment_failed',
              data: {
                object: {
                  parent: {
                    subscription_details: {
                      subscription: 'sub_999',
                    },
                  },
                },
              },
            })),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_invoice"}'), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ received: true });
    expect(updates.some((entry) => entry.table === 'subscriptions')).toBe(true);
  });

  it('returns 200 and skips provisioning when checkout session is missing client_reference_id', async () => {
    const { supabase, updates, upserts } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: {
            constructEvent: vi.fn(() => ({
              type: 'checkout.session.completed',
              data: {
                object: {
                  client_reference_id: null,
                  customer: 'cus_123',
                  subscription: 'sub_123',
                },
              },
            })),
          },
          subscriptions: {
            retrieve: vi.fn(async () => ({
              id: 'sub_123',
              status: 'active',
              cancel_at_period_end: false,
              items: { data: [{ current_period_end: 1_800_000_000 }] },
            })),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_missing_ref"}'), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ received: true });
    expect(updates).toHaveLength(0);
    expect(upserts).toHaveLength(0);
  });

  it('returns 500 when DB upsert throws during checkout provisioning', async () => {
    const { supabase } = createSupabaseMockWithUpsertError();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: {
            constructEvent: vi.fn(() => ({
              type: 'checkout.session.completed',
              data: {
                object: {
                  client_reference_id: 'user_1',
                  customer: 'cus_123',
                  subscription: 'sub_123',
                },
              },
            })),
          },
          subscriptions: {
            retrieve: vi.fn(async () => ({
              id: 'sub_123',
              status: 'active',
              cancel_at_period_end: false,
              items: { data: [{ current_period_end: 1_800_000_000 }] },
            })),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_checkout_upsert_err"}'), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Webhook handler failed' });
  });

  it('returns 200 when subscription update has no matching profile', async () => {
    const { supabase, upserts } = createSupabaseMock(null);

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    vi.doMock('./_stripe.js', () => ({
      getStripeConfig: () => ({
        stripe: {
          webhooks: {
            constructEvent: vi.fn(() => ({
              type: 'customer.subscription.updated',
              data: {
                object: {
                  id: 'sub_987',
                  customer: 'cus_missing',
                  status: 'active',
                  cancel_at_period_end: false,
                  items: { data: [{ current_period_end: 1_800_000_000 }] },
                },
              },
            })),
          },
        },
        webhookSecret: 'whsec_test',
      }),
    }));

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { default: handler } = await import('./webhook-stripe.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await handler(createWebhookReq('{"id":"evt_subscription_no_profile"}'), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ received: true });
    expect(upserts).toHaveLength(0);
  });
});
