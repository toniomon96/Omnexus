import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type OperationKind = 'eq' | 'or';

type OperationRecord = {
  table: string;
  action: 'delete';
  kind: OperationKind;
  value: string;
};

type StorageRecord =
  | { action: 'list'; bucket: string; path: string }
  | { action: 'remove'; bucket: string; paths: string[] };

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
    method: 'DELETE',
    headers: { origin: 'http://localhost:3000', authorization: 'Bearer valid-token' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as VercelRequest;
}

function createDeleteChain(
  table: string,
  operations: OperationRecord[],
  options: { throwOnDelete?: string; throwOnEq?: string } = {},
) {
  return {
    eq(column: string, value: string) {
      operations.push({ table, action: 'delete', kind: 'eq', value: `${column}:${value}` });
      if (options.throwOnEq === table) {
        throw new Error(`eq failed for ${table}`);
      }
      return Promise.resolve({ data: null, error: null });
    },
    or(expression: string) {
      operations.push({ table, action: 'delete', kind: 'or', value: expression });
      if (options.throwOnDelete === table) {
        throw new Error(`delete failed for ${table}`);
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
}

function createSupabaseMock(options: {
  authError?: boolean;
  missingUser?: boolean;
  throwOnDelete?: string;
  throwOnEq?: string;
  authDeleteError?: boolean;
} = {}) {
  const operations: OperationRecord[] = [];
  const storageOps: StorageRecord[] = [];

  const supabase = {
    auth: {
      getUser: vi.fn(async () => {
        if (options.authError) {
          return { data: { user: null }, error: new Error('invalid token') };
        }
        if (options.missingUser) {
          return { data: { user: null }, error: null };
        }
        return { data: { user: { id: 'user_1' } }, error: null };
      }),
      admin: {
        deleteUser: vi.fn(async () => {
          if (options.authDeleteError) {
            return { error: { message: 'auth delete failed' } };
          }
          return { error: null };
        }),
      },
    },
    storage: {
      from: vi.fn((bucket: string) => ({
        list: vi.fn(async (path: string) => {
          storageOps.push({ action: 'list', bucket, path });
          return { data: [{ name: 'avatar-1.png' }], error: null };
        }),
        remove: vi.fn(async (paths: string[]) => {
          storageOps.push({ action: 'remove', bucket, paths });
          return { data: null, error: null };
        }),
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => {
              operations.push({ table, action: 'delete', kind: 'eq', value: `${column}:${value}` });
              if (options.throwOnEq === table) {
                throw new Error(`eq failed for ${table}`);
              }
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        };
      }

      if (table === 'challenges') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => {
              operations.push({ table, action: 'delete', kind: 'eq', value: `${column}:${value}` });
              if (options.throwOnEq === table) {
                throw new Error(`eq failed for ${table}`);
              }
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        };
      }

      return {
        delete: vi.fn(() => {
          if (options.throwOnDelete === table) {
            throw new Error(`delete failed for ${table}`);
          }
          return createDeleteChain(table, operations, options);
        }),
      };
    }),
  };

  return { supabase, operations, storageOps };
}

describe('delete-account route hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 401 when bearer token is missing', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { supabase } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const { default: deleteAccount } = await import('./delete-account.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await deleteAccount(
      createReq({ headers: { origin: 'http://localhost:3000' } }),
      res,
    );

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when bearer token is invalid', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { supabase } = createSupabaseMock({ authError: true });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const { default: deleteAccount } = await import('./delete-account.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await deleteAccount(createReq(), res);

    expect(getStatusCode()).toBe(401);
    expect(getBody()).toEqual({ error: 'Invalid token' });
  });

  it('returns 500 when one of the child-table deletions throws', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { supabase, operations } = createSupabaseMock({ throwOnDelete: 'friendships' });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const { default: deleteAccount } = await import('./delete-account.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await deleteAccount(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Failed to delete account' });
    expect(operations.some((op) => op.table === 'challenge_participants')).toBe(true);
    expect(operations.some((op) => op.table === 'profiles')).toBe(false);
  });

  it('returns 500 when auth user deletion fails after data cleanup', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { supabase, operations, storageOps } = createSupabaseMock({ authDeleteError: true });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const { default: deleteAccount } = await import('./delete-account.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await deleteAccount(createReq(), res);

    expect(getStatusCode()).toBe(500);
    expect(getBody()).toEqual({ error: 'Failed to delete account' });
    expect(operations.some((op) => op.table === 'profiles')).toBe(true);
    expect(storageOps.some((op) => op.action === 'list')).toBe(true);
  });

  it('returns 200 and completes deletion flow when all operations succeed', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';

    const { supabase, operations, storageOps } = createSupabaseMock();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => supabase,
    }));

    const { default: deleteAccount } = await import('./delete-account.js');
    const { res, getStatusCode, getBody } = createMockResponse();

    await deleteAccount(createReq(), res);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toEqual({ ok: true });
    expect(operations.some((op) => op.table === 'profiles')).toBe(true);
    expect(storageOps.some((op) => op.action === 'remove')).toBe(true);
  });
});
