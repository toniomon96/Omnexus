import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../types';
import { getWeekStart } from '../../utils/dateUtils';
import { getExerciseNameMap } from '../../lib/staticCatalogs';
import { generateWeeklyCard } from '../../utils/shareCard';
import { ShareCardModal } from '../ui/ShareCardModal';
import { TrendingUp, TrendingDown, Minus, Dumbbell, Share2, CalendarCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { calculateStreak } from '../../utils/dateUtils';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass } from '../../utils/weightUnits';
import { trackFeatureEntry, trackWeeklyProgressModuleEvent } from '../../lib/analytics';

interface WeeklyRecapCardProps {
  sessions: WorkoutSession[];
}

interface WeeklyPrimaryAction {
  label: string;
  description: string;
  destination: '/train' | '/insights';
}

function getLastWeekStart(): string {
  const d = new Date(getWeekStart());
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function WeeklyRecapCard({ sessions }: WeeklyRecapCardProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const weightUnit = useWeightUnit();
  const [showShare, setShowShare] = useState(false);
  const [topExerciseName, setTopExerciseName] = useState<string | null>(null);
  const trackedShownRef = useRef<string | null>(null);

  const thisWeekStart = getWeekStart();
  const lastWeekStart = getLastWeekStart();

  const thisWeek = sessions.filter((s) => s.startedAt >= thisWeekStart);
  const lastWeek = sessions.filter(
    (s) => s.startedAt >= lastWeekStart && s.startedAt < thisWeekStart,
  );

  const thisVol = thisWeek.reduce((t, s) => t + s.totalVolumeKg, 0);
  const lastVol = lastWeek.reduce((t, s) => t + s.totalVolumeKg, 0);
  const thisDurationMin = Math.round(
    thisWeek.reduce((t, s) => t + (s.durationSeconds ?? 0), 0) / 60,
  );
  const weeklyGoal = 3;
  const sessionsRemaining = Math.max(0, weeklyGoal - thisWeek.length);
  const weeklyProgressSegments = Array.from({ length: weeklyGoal }, (_, i) => i < thisWeek.length);

  const delta = lastVol > 0 ? ((thisVol - lastVol) / lastVol) * 100 : null;

  // Top exercise this week
  const muscleCounts: Record<string, number> = {};
  thisWeek.forEach((s) =>
    s.exercises.forEach((e) => {
      const key = e.exerciseId;
      muscleCounts[key] = (muscleCounts[key] ?? 0) + e.sets.filter((st) => st.completed).length;
    }),
  );
  const topExerciseId = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  useEffect(() => {
    let cancelled = false;

    if (!topExerciseId) {
      setTopExerciseName(null);
      return () => {
        cancelled = true;
      };
    }

    void getExerciseNameMap([topExerciseId]).then((names) => {
      if (!cancelled) {
        setTopExerciseName(names[topExerciseId] ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [topExerciseId]);

  if (thisWeek.length === 0 && lastWeek.length === 0) return null;

  const TrendIcon =
    delta === null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta === null
      ? 'text-slate-400'
      : delta > 0
      ? 'text-green-500'
      : delta < 0
      ? 'text-red-400'
      : 'text-slate-400';

  const streak = calculateStreak(sessions.map((s) => s.startedAt));

  const primaryAction: WeeklyPrimaryAction = thisWeek.length < weeklyGoal
    ? {
        label: sessionsRemaining === 1 ? 'Plan 1 more workout this week' : `Plan ${sessionsRemaining} more workouts this week`,
        description: 'Use Train to keep weekly momentum moving while it is fresh.',
        destination: '/train',
      }
    : {
        label: 'Review weekly insights',
        description: 'You hit your weekly goal. Check insights to decide what to focus on next.',
        destination: '/insights',
      };

  useEffect(() => {
    const trackingKey = `${state.user?.id ?? 'guest'}:${thisWeek.length}:${weeklyGoal}`;
    if (trackedShownRef.current === trackingKey) return;
    trackWeeklyProgressModuleEvent({
      action: 'shown',
      sessionsThisWeek: thisWeek.length,
      weeklyGoal,
      hasMetGoal: thisWeek.length >= weeklyGoal,
      destination: primaryAction.destination,
    });
    trackedShownRef.current = trackingKey;
  }, [primaryAction.destination, state.user?.id, thisWeek.length]);

  function handlePrimaryActionClick() {
    trackWeeklyProgressModuleEvent({
      action: 'clicked',
      sessionsThisWeek: thisWeek.length,
      weeklyGoal,
      hasMetGoal: thisWeek.length >= weeklyGoal,
      destination: primaryAction.destination,
    });
    trackFeatureEntry({
      source: 'dashboard_weekly_progress',
      destination: primaryAction.destination,
      label: 'weekly_progress_primary_action',
    });
    navigate(primaryAction.destination);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 space-y-3" data-testid="dashboard-weekly-progress-module">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">This week</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">Progress and momentum</p>
          </div>
          <div className="flex items-center gap-2">
            {delta !== null && (
              <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
                <TrendIcon size={13} />
                {Math.abs(delta).toFixed(0)}% vs last week
              </span>
            )}
            {thisWeek.length > 0 && (
              <button
                onClick={() => setShowShare(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Share this week's progress"
              >
                <Share2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Weekly goal progress</p>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{thisWeek.length}/{weeklyGoal} sessions</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5" role="presentation" aria-hidden="true">
            {weeklyProgressSegments.map((isComplete, index) => (
              <span
                key={`goal-segment-${index}`}
                className={[
                  'h-2 rounded-full transition-colors',
                  isComplete ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CalendarCheck size={12} className="text-brand-500" />
            <span>
              {sessionsRemaining > 0
                ? `${sessionsRemaining} more session${sessionsRemaining === 1 ? '' : 's'} to hit this week's target.`
                : 'Weekly target reached. Keep building on this momentum.'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold">{thisWeek.length}</span>
            <span className="text-[11px] text-slate-400">sessions</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold">
              {formatMass(thisVol, weightUnit)}
            </span>
            <span className="text-[11px] text-slate-400">volume</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold">
              {thisDurationMin >= 60
                ? `${(thisDurationMin / 60).toFixed(1)}h`
                : `${thisDurationMin}m`}
            </span>
            <span className="text-[11px] text-slate-400">time</span>
          </div>
        </div>

        {/* Last week comparison bar */}
        {lastVol > 0 && thisVol > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Last week {formatMass(lastVol, weightUnit)}</span>
              <span>This week {formatMass(thisVol, weightUnit)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className={[
                'rounded-lg px-2 py-1 text-[11px] font-medium text-center',
                thisVol >= lastVol
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
              ].join(' ')}>
                This week
              </span>
              <span className={[
                'rounded-lg px-2 py-1 text-[11px] font-medium text-center',
                lastVol > thisVol
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
              ].join(' ')}>
                Last week
              </span>
            </div>
          </div>
        )}

        {topExerciseId && (
          <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-2.5">
            <Dumbbell size={13} className="text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-400">
              Most sets:{' '}
              <span className="text-slate-900 dark:text-white font-medium">
                {topExerciseName ?? topExerciseId.replace(/-/g, ' ')}
              </span>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePrimaryActionClick}
          data-testid="dashboard-weekly-progress-primary-action"
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-left transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-brand-700"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{primaryAction.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{primaryAction.description}</p>
          </div>
          <ArrowRight size={14} className="text-brand-500 shrink-0" />
        </button>
      </div>

      <ShareCardModal
        open={showShare}
        onClose={() => setShowShare(false)}
        title="Share this week"
        filename="omnexus-week.png"
        generate={() =>
          generateWeeklyCard({
            sessions: thisWeek.length,
            volumeKg: thisVol,
            durationMinutes: thisDurationMin,
            streakDays: streak,
            weightUnit,
            userName: state.user?.name,
          })
        }
      />
    </>
  );
}
