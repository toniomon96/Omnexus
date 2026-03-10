import type { LeaderboardEntry } from '../../types';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass } from '../../utils/weightUnits';

interface LeaderboardRowProps {
  rank: number;
  entry: LeaderboardEntry;
}

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

export function LeaderboardRow({ rank, entry }: LeaderboardRowProps) {
  const weightUnit = useWeightUnit();
  return (
    <div
      className={[
        'flex items-center gap-3 py-3 px-4 rounded-xl transition-colors',
        entry.isCurrentUser
          ? 'bg-brand-500/10 border border-brand-500/20'
          : 'bg-slate-800/40',
      ].join(' ')}
    >
      <span
        className={[
          'w-6 text-center text-sm font-bold shrink-0',
          RANK_STYLES[rank] ?? 'text-slate-400',
        ].join(' ')}
      >
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {entry.name}
          {entry.isCurrentUser && (
            <span className="ml-2 text-xs font-normal text-brand-400">(you)</span>
          )}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {formatMass(entry.weeklyVolumeKg, weightUnit)}
        </p>
        <p className="text-xs text-slate-400">this week</p>
      </div>
    </div>
  );
}
