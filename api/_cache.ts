import type { VercelResponse } from '@vercel/node';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const inMemoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_MAX_ENTRIES = 500;

export function setEdgeCacheHeaders(res: VercelResponse, sMaxAgeSeconds: number, staleWhileRevalidateSeconds: number): void {
  res.setHeader(
    'Cache-Control',
    `s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
  );
}

export function getMemoryCache<T>(key: string): T | null {
  const hit = inMemoryCache.get(key);
  if (!hit) return null;

  if (hit.expiresAt <= Date.now()) {
    inMemoryCache.delete(key);
    return null;
  }

  return hit.value as T;
}

export function setMemoryCache<T>(key: string, value: T, ttlSeconds: number): void {
  pruneExpiredEntries();
  if (inMemoryCache.size >= DEFAULT_MAX_ENTRIES) {
    pruneOldestEntry();
  }

  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function buildCacheKey(prefix: string, parts: Array<string | number | boolean | null | undefined>): string {
  const normalized = parts.map((part) => String(part ?? ''));
  return `${prefix}:${normalized.join('|')}`;
}

function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt <= now) {
      inMemoryCache.delete(key);
    }
  }
}

function pruneOldestEntry(): void {
  const firstKey = inMemoryCache.keys().next().value as string | undefined;
  if (firstKey) {
    inMemoryCache.delete(firstKey);
  }
}
