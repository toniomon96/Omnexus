import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, CheckCircle2, Calendar, Target } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import type { AiChallenge } from '../types';
import { getWorkoutHistory } from '../utils/localStorage';
import { countSessionsLast30Days, getTotalWeeklyVolumeKg } from '../utils/volumeUtils';
import { useWeightUnit } from '../hooks/useWeightUnit';
import {
  getPersonalChallengeTargetDisplay,
  getMetricProgress,
} from '../components/challenges/PersonalChallengeCard';

async function loadAiChallenges(userId: string) {
  const { getAiChallenges } = await import('../lib/db');
  return getAiChallenges(userId);
}

const METRIC_LABELS: Record<AiChallenge['metric'], string> = {
  total_volume: 'Total Volume Lifted',
  sessions_count: 'Workout Sessions',
  pr_count: 'Personal Records',
  consistency: 'Consistency',
};

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const weightUnit = useWeightUnit();

  const userId = state.user?.id ?? '';

  const [challenge, setChallenge] = useState<AiChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const workoutStats = useMemo(() => {
    const sessions = getWorkoutHistory();
    return {
      sessionsLast30Days: countSessionsLast30Days(sessions),
      weeklyVolumeKg: Math.round(getTotalWeeklyVolumeKg(sessions)),
    };
  }, []);

  useEffect(() => {
    if (!userId || !id) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await loadAiChallenges(userId);
        const found = all.find((c) => c.id === id);
        if (!cancelled) {
          if (found) {
            setChallenge(found);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, id]);

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 py-6 space-y-4">
          <Skeleton variant="text" className="w-3/4 h-6" />
          <Skeleton variant="text" className="w-full h-4" />
          <Skeleton variant="text" className="w-1/2 h-4" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !challenge) {
    return (
      <AppShell>
        <div className="px-4 py-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500 mb-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <p className="text-slate-500 dark:text-slate-400">Challenge not found.</p>
        </div>
      </AppShell>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  const todayDate = new Date(today);
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = challenge.startDate <= today && challenge.endDate >= today;
  const isExpired = challenge.endDate < today;

  const { currentValue, progressPct } = getMetricProgress(
    challenge,
    workoutStats.sessionsLast30Days,
    workoutStats.weeklyVolumeKg,
  );
  const isComplete = progressPct >= 100;

  const { targetText: displayTargetText, unitText: displayUnit } = getPersonalChallengeTargetDisplay(challenge, weightUnit);
  const metricLabel = METRIC_LABELS[challenge.metric] ?? challenge.metric;

  const currentDisplayValue = challenge.metric === 'total_volume'
    ? Math.round(challenge.metric === 'total_volume' ? workoutStats.weeklyVolumeKg : currentValue)
    : currentValue;

  return (
    <AppShell>
      <div className="px-4 pb-8 space-y-4 mt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 shrink-0">
            <Zap size={20} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{challenge.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {isComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                  <CheckCircle2 size={11} /> Complete!
                </span>
              )}
              {!isComplete && isActive && (
                <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                  Active
                </span>
              )}
              {isExpired && !isComplete && (
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Expired
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <Card>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{challenge.description}</p>
        </Card>

        {/* Dates */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Start</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">End</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          {isActive && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining · {totalDays} day challenge
            </p>
          )}
        </Card>

        {/* Goal & Progress */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Goal</p>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
            <span className="font-semibold">{metricLabel}:</span> complete{' '}
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {displayTargetText} {displayUnit}
            </span>{' '}
            by {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>

          {(challenge.metric === 'sessions_count' || challenge.metric === 'total_volume') && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-3 mb-1.5">
                <span>
                  Progress: {currentDisplayValue}{' '}
                  {challenge.metric === 'total_volume' ? weightUnit : ''} / {displayTargetText} {displayUnit}
                </span>
                {isComplete
                  ? <span className="text-green-600 dark:text-green-400 font-semibold">✓ Done!</span>
                  : <span className="font-medium">{progressPct}%</span>
                }
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500',
                    isComplete ? 'bg-green-500' : 'bg-brand-500',
                  ].join(' ')}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          )}

          {(challenge.metric === 'pr_count' || challenge.metric === 'consistency') && (
            <p className="mt-3 text-xs text-slate-400">
              Progress for this metric is tracked automatically during your workouts.
            </p>
          )}

          {isComplete && (
            <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-3 py-2.5">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 size={15} /> Challenge Complete!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                You've reached your target. Great work!
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
