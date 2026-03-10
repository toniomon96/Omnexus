import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import { buildCacheKey, getMemoryCache, setEdgeCacheHeaders, setMemoryCache } from './_cache.js';

function createMockResponse() {
  const headers = new Map<string, string>();
  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getHeader: (name: string) => headers.get(name),
  };
}

describe('_cache helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets edge cache headers with s-maxage and stale-while-revalidate', () => {
    const { res, getHeader } = createMockResponse();

    setEdgeCacheHeaders(res, 60, 600);

    expect(getHeader('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=600');
  });

  it('builds stable cache keys with nullish normalization', () => {
    const key = buildCacheKey('articles', ['nutrition', 5, true, null, undefined]);

    expect(key).toBe('articles:nutrition|5|true||');
  });

  it('stores and retrieves cached values before expiration', () => {
    vi.useFakeTimers();

    setMemoryCache('k1', { ok: true }, 10);
    const hit = getMemoryCache<{ ok: boolean }>('k1');

    expect(hit).toEqual({ ok: true });
  });

  it('expires cached values after ttl', () => {
    vi.useFakeTimers();

    setMemoryCache('k2', { value: 42 }, 1);
    vi.advanceTimersByTime(1100);

    const hit = getMemoryCache<{ value: number }>('k2');
    expect(hit).toBeNull();
  });

  it('evicts the oldest entry when cache exceeds max entries', () => {
    for (let i = 0; i < 510; i += 1) {
      setMemoryCache(`evict-${i}`, { value: i }, 60);
    }

    expect(getMemoryCache<{ value: number }>('evict-0')).toBeNull();
    expect(getMemoryCache<{ value: number }>('evict-509')).toEqual({ value: 509 });
  });
});
