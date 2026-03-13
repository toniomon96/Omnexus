import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AiDegradedStateCard } from '../components/ui/AiDegradedStateCard';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { MarkdownText } from '../components/ui/MarkdownText';
import { ArticleFeed } from '../components/insights/ArticleFeed';
import { AdaptationCard } from '../components/insights/AdaptationCard';
import { PeerInsightsCard } from '../components/insights/PeerInsightsCard';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getWorkoutInsights } from '../services/claudeService';
import { buildInsightRequest } from '../services/insightsService';
import { Sparkles, Loader, Shield, MessageCircle, BarChart2, Newspaper, Play } from 'lucide-react';
import type { LearningCategory, Goal } from '../types';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { getExperienceMode } from '../utils/localStorage';
import { getWeekStart } from '../utils/dateUtils';
import { trackAiDegradedStateEvent, trackFeatureEntry, trackInsightRecommendationEvent } from '../lib/analytics';
import { normalizeAiError } from '../lib/aiErrorHandling';

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

interface InsightNextStepRecommendation {
  label: string;
  description: string;
  destination: '/train' | '/history' | '/ask' | '/onboarding';
}

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
  const recommendationTrackedRef = useRef<string | null>(null);
  const lastDegradedErrorKindRef = useRef<'auth' | 'upgrade' | 'network' | 'rate_limit' | 'server' | 'unknown' | null>(null);

  if (!user) return null;
  const userId = user.id;
  const isGuestUser = Boolean(user.isGuest);

  const experienceMode = getExperienceMode(userId);
  const isGuidedMode = experienceMode === 'guided';

  const hasHistory = sessions.some((s) => s.completedAt);
  const weekStart = getWeekStart();
  const sessionsThisWeek = sessions.filter((s) => s.completedAt && s.startedAt >= weekStart).length;

  const recommendation: InsightNextStepRecommendation = user.isGuest
    ? {
        label: 'Create an account to unlock personalized next steps',
        description: 'Insights recommendations need workout history saved to your account.',
        destination: '/onboarding' as const,
      }
    : !hasHistory
    ? {
        label: 'Start your next workout',
        description: 'Complete a few sessions so Insights can generate personalized guidance.',
        destination: '/train' as const,
      }
    : insight
    ? {
        label: 'Turn this into a focused Ask prompt',
        description: 'Use Ask Omnexus to get one concrete plan for your next session from this analysis.',
        destination: '/ask' as const,
      }
    : sessionsThisWeek < 3
    ? {
        label: 'Plan your next workout this week',
        description: 'Use Train to keep momentum while your progress context is fresh.',
        destination: '/train' as const,
      }
    : {
        label: 'Review workout history patterns',
        description: 'Compare recent sessions and use trend changes to choose your next focus.',
        destination: '/history' as const,
      };

  useEffect(() => {
    const trackingKey = `${userId}:${recommendation.destination}:${hasHistory}:${Boolean(insight)}:${isGuestUser}`;
    if (recommendationTrackedRef.current === trackingKey) return;
    trackInsightRecommendationEvent({
      action: 'shown',
      destination: recommendation.destination,
      hasHistory,
      hasInsight: Boolean(insight),
      isGuest: isGuestUser,
    });
    recommendationTrackedRef.current = trackingKey;
  }, [hasHistory, insight, recommendation.destination, userId, isGuestUser]);

  function handleRecommendationAction() {
    trackInsightRecommendationEvent({
      action: 'clicked',
      destination: recommendation.destination,
      hasHistory,
      hasInsight: Boolean(insight),
      isGuest: isGuestUser,
    });

    if (recommendation.destination === '/ask') {
      trackFeatureEntry({ source: 'insights_recommendation', destination: '/ask', label: 'ai_next_step_follow_up' });
      navigate('/ask', {
        state: {
          prefill: 'Based on my latest insights, what should I prioritize in my next workout?',
        },
      });
      return;
    }

    trackFeatureEntry({ source: 'insights_recommendation', destination: recommendation.destination, label: 'ai_next_step_continue' });
    navigate(recommendation.destination);
  }

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
      if (lastDegradedErrorKindRef.current) {
        trackAiDegradedStateEvent({
          surface: 'insights',
          action: 'recovered',
          errorKind: lastDegradedErrorKindRef.current,
        });
        lastDegradedErrorKindRef.current = null;
      }
    } catch (err) {
      console.error('[InsightsPage] Failed to generate insights:', err);
      const normalized = normalizeAiError(err, { surface: 'insights' });
      setError(normalized.message);
      lastDegradedErrorKindRef.current = normalized.kind;
      trackAiDegradedStateEvent({
        surface: 'insights',
        action: 'shown',
        errorKind: normalized.kind,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleRetryAnalyze() {
    if (lastDegradedErrorKindRef.current) {
      trackAiDegradedStateEvent({
        surface: 'insights',
        action: 'retry_clicked',
        errorKind: lastDegradedErrorKindRef.current,
      });
    }
    void handleAnalyze();
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
              Patterns from your workouts, grounded in evidence
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
                Insights analyze your workout history. Create an account to unlock personalized recommendations.
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
                Insights appear after completed workouts. Log a few sessions, then analyze your trends.
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
          <AiDegradedStateCard
            title="Insights are temporarily unavailable"
            message={error}
            onRetry={!user.isGuest ? handleRetryAnalyze : undefined}
            retryDisabled={loading}
            testId="insights-degraded-state"
          />
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

        <Card className="border-brand-200 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-900/20" data-testid="insights-next-step-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Recommended next step</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{recommendation.label}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{recommendation.description}</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={handleRecommendationAction}
            data-testid="insights-next-step-action"
          >
            Continue
          </Button>
        </Card>

        {/* Quick questions → AskPage */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Ask a follow-up
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
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
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
