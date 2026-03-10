import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { MarkdownText } from '../components/ui/MarkdownText';
import { ArticleFeed } from '../components/insights/ArticleFeed';
import { AdaptationCard } from '../components/insights/AdaptationCard';
import { PeerInsightsCard } from '../components/insights/PeerInsightsCard';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, getWorkoutInsights } from '../services/claudeService';
import { buildInsightRequest } from '../services/insightsService';
import { Sparkles, Loader, Shield, MessageCircle, BarChart2, Newspaper, Play } from 'lucide-react';
import type { LearningCategory, Goal } from '../types';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { getExperienceMode } from '../utils/localStorage';

const GOAL_CATEGORY: Record<Goal, LearningCategory> = {
  'hypertrophy': 'strength-training',
  'fat-loss': 'nutrition',
  'general-fitness': 'strength-training',
};

const QUICK_QUESTIONS = [
  'How can I improve my recovery between sessions?',
  'Am I training with enough volume for muscle growth?',
  'What should I focus on to break through a plateau?',
];

export function InsightsPage() {
  const { state } = useApp();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const user = state.user;
  const sessions = state.history.sessions;
  const weightUnit = useWeightUnit();

  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const experienceMode = getExperienceMode(user.id);
  const isGuidedMode = experienceMode === 'guided';

  const hasHistory = sessions.some((s) => s.completedAt);

  async function handleAnalyze() {
    if (!user) return;
    if (user.isGuest) {
      setError('Insights require an account because they analyze your workout history.');
      return;
    }

    setLoading(true);
    setInsight(null);
    setError(null);

    try {
      const request = await buildInsightRequest(sessions, user, weightUnit);
      if (!request) {
        setError(
          'No completed workouts found in the last 4 weeks. Log a few sessions and come back!',
        );
        return;
      }

      const { insight: text } = await getWorkoutInsights(request);
      setInsight(text);
    } catch (err) {
      console.error('[InsightsPage] Failed to generate insights:', err);
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('Insights require an account because they analyze your workout history.');
      } else if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError(
          'We could not reach the insights service right now. Check your connection and try again.',
        );
      } else {
        setError('We couldn\'t generate insights right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="Insights" />
      <div className="px-4 pb-8 pt-4 space-y-5">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 shrink-0">
            <Sparkles size={24} className="text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              AI-Powered Insights
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your data × science × Claude
            </p>
          </div>
        </div>

        {/* Adaptation from last session */}
        <AdaptationCard />

        {/* Peer benchmarking */}
        {authUser && !user.isGuest && (
          <PeerInsightsCard
            userId={authUser.id}
            goal={user.goal}
            experienceLevel={user.experienceLevel}
          />
        )}

        {/* Analyze card */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 shrink-0">
              <BarChart2 size={18} className="text-brand-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                Workout Analysis
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Analyzes your last 4 weeks of training and returns personalized,
                evidence-based observations and recommendations.
              </p>
            </div>
          </div>

          {user.isGuest ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Insights require an account because they analyze your workout history.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create an account to unlock personalized training insights.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate('/onboarding')}>
                  Create Account
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </div>
          ) : !hasHistory ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Insights appear after you complete workouts. Log a few sessions and Omnexus will analyze your progress.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/train')}>
                <Play size={14} />
                Start a workout
              </Button>
            </div>
          ) : (
            <Button
              fullWidth
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {insight ? 'Re-analyze' : 'Analyze My Training'}
                </>
              )}
            </Button>
          )}
        </Card>

        {isGuidedMode && (
          <TermHelpChips
            title="Insights terms explained"
            terms={[
              {
                key: 'volume',
                label: 'Volume',
                description: 'Total training work (sets x reps x weight) across your sessions.',
              },
              {
                key: 'plateau',
                label: 'Plateau',
                description: 'A period where progress slows down. Adjusting training can restart progress.',
              },
              {
                key: 'recovery',
                label: 'Recovery',
                description: 'How well your body bounces back between workouts (sleep, stress, soreness, and rest).',
              },
            ]}
          />
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            {!user.isGuest && (
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-2 text-sm font-medium text-brand-500 hover:underline"
              >
                Retry
              </button>
            )}
          </Card>
        )}

        {/* Insight result */}
        {insight && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">
              Your Analysis
            </p>
            <MarkdownText text={insight} />
          </Card>
        )}

        {/* Quick questions → AskPage */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Ask a Follow-Up
          </p>
          {user.isGuest ? (
            <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Follow-up coaching from Insights is available with an account.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => navigate('/onboarding')}>
                  Create Account
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => navigate('/ask', { state: { prefill: q } })}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
                >
                  <MessageCircle size={14} className="text-brand-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{q}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Safety notice */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              AI insights are <strong>educational information only</strong>, not
              medical advice. Always consult a qualified healthcare professional
              for personal health concerns.
            </p>
          </div>
        </Card>

        {/* Research feed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={16} className="text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Latest Research
            </p>
          </div>
          <ArticleFeed initialCategory={GOAL_CATEGORY[user.goal]} />
        </div>

      </div>
    </AppShell>
  );
}
