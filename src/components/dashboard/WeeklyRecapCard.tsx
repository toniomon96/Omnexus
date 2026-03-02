import { useState } from 'react';
import type { WorkoutSession } from '../../types';
import { getWeekStart } from '../../utils/dateUtils';
import { getExerciseById } from '../../data/exercises';
import { generateWeeklyCard } from '../../utils/shareCard';
import { ShareCardModal } from '../ui/ShareCardModal';
import { TrendingUp, TrendingDown, Minus, Dumbbell, Share2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { calculateStreak } from '../../utils/dateUtils';

interface WeeklyRecapCardProps {
  sessions: WorkoutSession[];
}

function getLastWeekStart(): string {
  const d = new Date(getWeekStart());
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function WeeklyRecapCard({ sessions }: WeeklyRecapCardProps) {
  const { state } = useApp();
  const [showShare, setShowShare] = useState(false);

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

  return (
    <>
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            This Week
          </p>
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

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold">{thisWeek.length}</span>
            <span className="text-[11px] text-slate-400">sessions</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold">
              {thisVol >= 1000
                ? `${(thisVol / 1000).toFixed(1)}t`
                : `${thisVol.toFixed(0)}kg`}
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
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Last week {lastVol.toFixed(0)} kg</span>
              <span>This week {thisVol.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (thisVol / Math.max(thisVol, lastVol)) * 100)}%` }}
              />
            </div>
            <div className="h-1.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (lastVol / Math.max(thisVol, lastVol)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {topExerciseId && (
          <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-2.5">
            <Dumbbell size={13} className="text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-400">
              Most sets:{' '}
              <span className="text-slate-900 dark:text-white font-medium">
                {getExerciseById(topExerciseId)?.name ?? topExerciseId.replace(/-/g, ' ')}
              </span>
            </p>
          </div>
        )}
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
            userName: state.user?.name,
          })
        }
      />
    </>
  );
}
