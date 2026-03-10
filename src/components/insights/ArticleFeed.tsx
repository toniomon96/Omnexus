import { useState, useEffect } from 'react';
import { Loader, RefreshCw } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { fetchArticlesByCategory, PubMedApiError } from '../../services/pubmedService';
import type { HealthArticle, LearningCategory } from '../../types';

const CATEGORIES: { value: LearningCategory; label: string }[] = [
  { value: 'strength-training', label: 'Strength' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'cardio', label: 'Cardio' },
];

interface ArticleFeedProps {
  initialCategory?: LearningCategory;
}

export function ArticleFeed({ initialCategory = 'strength-training' }: ArticleFeedProps) {
  const [category, setCategory] = useState<LearningCategory>(initialCategory);
  const [retryKey, setRetryKey] = useState(0);
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchArticlesByCategory(category, 5);
        if (!cancelled) setArticles(results);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof PubMedApiError) {
            setError(err.message);
          } else {
            setError('We\'re temporarily having trouble loading the latest research. Please try again in a moment.');
          }
        }
        console.error('[ArticleFeed] Failed to load articles:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, retryKey]);

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === value
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Fetching from PubMed…</span>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="flex items-center justify-center gap-1.5 mx-auto text-sm text-brand-500 hover:underline"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
          No articles found.
        </p>
      )}

      {!loading && !error && articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Powered by{' '}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          PubMed
        </a>{' '}
        · Results cached 6 h
      </p>
    </div>
  );
}
