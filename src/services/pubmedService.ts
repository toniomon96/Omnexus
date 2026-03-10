import type { HealthArticle, LearningCategory } from '../types';
import { getArticleCache, setArticleCache } from '../utils/localStorage';
import { apiBase } from '../lib/api';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class PubMedApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'PubMedApiError';
  }
}

export async function fetchArticlesByCategory(
  category: LearningCategory,
  limit = 5,
): Promise<HealthArticle[]> {
  const cache = getArticleCache();
  const lastFetched = cache.lastFetchedAt[category];
  const cached = cache.articles.filter((a) => a.category === category);

  // Serve from cache if fresh
  if (lastFetched && cached.length > 0) {
    const age = Date.now() - new Date(lastFetched).getTime();
    if (age < CACHE_TTL_MS) return cached.slice(0, limit);
  }

  const res = await fetch(`${apiBase}/api/articles?category=${category}&limit=${limit}`);
  if (!res.ok) {
    let message = 'We\'re temporarily having trouble loading the latest research. Please try again in a moment.';
    if (res.status === 401) {
      message = 'Access to research articles is temporarily unavailable. Please sign in and try again.';
    } else if (res.status === 403) {
      message = 'Access to research articles is currently blocked for this app origin. Please verify deployment domain settings and try again.';
    }
    throw new PubMedApiError(message, res.status);
  }

  const { articles } = (await res.json()) as { articles: HealthArticle[] };

  // Merge into cache (replace this category's articles)
  setArticleCache({
    articles: [...cache.articles.filter((a) => a.category !== category), ...articles],
    lastFetchedAt: {
      ...cache.lastFetchedAt,
      [category]: new Date().toISOString(),
    },
  });

  return articles;
}
