import { useState, useEffect } from 'react';
import type { Goal, LearningCategory, HealthArticle } from '../../types';
import { Card } from '../ui/Card';
import { ExternalLink, BookOpen } from 'lucide-react';
import { getDailySnippetCache, setDailySnippetCache } from '../../utils/localStorage';

interface DailyLearningCardProps {
  goal: Goal;
}

const GOAL_CATEGORY: Record<Goal, LearningCategory> = {
  hypertrophy:       'strength-training',
  'fat-loss':        'metabolic-health',
  'general-fitness': 'cardio',
};

export function DailyLearningCard({ goal }: DailyLearningCardProps) {
  const [article, setArticle] = useState<HealthArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = getDailySnippetCache();

    if (cached && cached.date === today) {
      setArticle(cached.article);
      setLoading(false);
      return;
    }

    const category = GOAL_CATEGORY[goal];
    fetch(`/api/articles?category=${category}&limit=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const first: HealthArticle | null = data?.articles?.[0] ?? null;
        if (first) {
          setDailySnippetCache({ date: today, article: first });
          setArticle(first);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [goal]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-16 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </Card>
    );
  }

  if (!article) return null;

  return (
    <Card gradient className="border-l-2 border-l-brand-500 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen size={16} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full capitalize">
              {article.category.replace(/-/g, ' ')}
            </span>
            <span className="text-xs text-slate-500">Daily Read</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 line-clamp-2 mb-1">{article.title}</p>
          <p className="text-xs text-slate-400 line-clamp-2">
            {article.summary.slice(0, 120)}{article.summary.length > 120 ? '…' : ''}
          </p>
          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Read on PubMed
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
