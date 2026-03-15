import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, Loader2, ChevronLeft, Trophy } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { getWorkoutHistory } from '../utils/localStorage';
import { computeChallengeProgress, metricLabel } from '../utils/challengeProgress';
import { getPersonalChallengeTargetDisplay } from '../components/challenges/PersonalChallengeCard';
import { toDisplayWeight } from '../utils/weightUnits';
import { updateAiChallengeProgress } from '../lib/db';
import type { AiChallenge } from '../types';

async function loadChallenge(challengeId: string, userId: string): Promise<AiChallenge | null> {
  const { getAiChallengeById } = await import('../lib/db');
  return getAiChallengeById(challengeId, userId);
}

export function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const weightUnit = useWeightUnit();
  const userId = state.user?.id ?? '';

  const [challenge, setChallenge] = useState<AiChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!challengeId || !userId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const c = await loadChallenge(challengeId!, userId);
        if (!cancelled) setChallenge(c);
      } catch {
        if (!cancelled) setError('Failed to load challenge');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [challengeId, userId]);

  // localStorage is synchronous; this page is not reactive to mid-session writes.
  const sessions = useMemo(() => getWorkoutHistory(), []);
  const rawProgress = useMemo(
    () => (challenge ? computeChallengeProgress(challenge, sessions) : 0),
    [challenge, sessions],
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-24">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      </AppShell>
    );
  }

  if (error || !challenge) {
    return (
      <AppShell>
        <div className="px-4 py-10 text-center">
          <p className="text-slate-500 dark:text-slate-400">{error || 'Challenge not found'}</p>
          <Button variant="ghost" onClick={() => navigate('/challenges')} className="mt-4">
            Back to Challenges
          </Button>
        </div>
      </AppShell>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date(challenge.endDate);
  const todayDate = new Date(today);
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const isActive = challenge.startDate <= today && challenge.endDate >= today;
  const isCompleted = rawProgress >= challenge.target;

  const displayProgress = challenge.metric === 'total_volume'
    ? toDisplayWeight(rawProgress, weightUnit)
    : rawProgress;
  const progressPct = challenge.target > 0
    ? Math.min(100, Math.round((rawProgress / challenge.target) * 100))
    : 0;

  const { targetText: displayTargetText, unitText: displayUnit } =
    getPersonalChallengeTargetDisplay(challenge, weightUnit);

  async function handleSyncProgress() {
    if (!challenge || !userId) return;
    setSaving(true);
    try {
      await updateAiChallengeProgress(challenge.id, userId, rawProgress);
    } catch {
      // Non-fatal: local progress is still shown
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/95 pt-safe">
        <div className="flex min-h-14 items-center gap-3 px-4 py-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-base font-bold text-slate-900 dark:text-white truncate">
            Challenge Details
          </p>
        </div>
      </div>

      <div className="px-4 pb-10 mt-4 space-y-4">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className={[
            'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
            isCompleted ? 'bg-green-500/15' : 'bg-brand-500/10',
          ].join(' ')}>
            {isCompleted
              ? <Trophy size={20} className="text-green-500" />
              : <Zap size={20} className="text-brand-500" />}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{challenge.title}</p>
            {isCompleted && (
              <p className="text-xs font-semibold text-green-500">Challenge completed! 🎉</p>
            )}
            {isActive && !isCompleted && (
              <p className="text-xs text-slate-400">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
            {!isActive && !isCompleted && (
              <p className="text-xs text-slate-400">
                {challenge.endDate < today ? 'Ended' : `Starts ${challenge.startDate}`}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Description</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{challenge.description}</p>
        </Card>

        {/* Goal */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Goal</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Metric</span>
              <span className="font-medium text-slate-900 dark:text-white capitalize">
                {metricLabel(challenge.metric)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Target</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {displayTargetText} {displayUnit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Window</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {challenge.startDate} → {challenge.endDate}
              </span>
            </div>
          </div>
        </Card>

        {/* Progress */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Progress</p>

          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {Math.round(displayProgress * 10) / 10}
                <span className="text-base font-normal text-slate-400 ml-1">{displayUnit}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                of {displayTargetText} {displayUnit} goal
              </p>
            </div>
            <p className="text-2xl font-bold text-brand-500">{progressPct}%</p>
          </div>

          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-4">
            <div
              className={[
                'h-full rounded-full transition-all duration-700',
                isCompleted ? 'bg-green-500' : 'bg-brand-500',
              ].join(' ')}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Progress is tracked automatically from your workout history
            ({metricLabel(challenge.metric)}).
          </p>

          <Button
            onClick={() => void handleSyncProgress()}
            disabled={saving}
            variant="ghost"
            size="sm"
            fullWidth
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Syncing…' : 'Sync progress to cloud'}
          </Button>
        </Card>

        {isCompleted && (
          <div className="rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-center">
            <p className="text-2xl mb-1">🏆</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              You crushed this challenge!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Generate a new challenge to keep the momentum going.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
