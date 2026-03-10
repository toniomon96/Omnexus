import type { MuscleGroup } from '../../types';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass, formatWeightValue } from '../../utils/weightUnits';

interface VolumeChartProps {
  weeklyVolume: Record<MuscleGroup, number[]>;
  weeks: number;
}

const TOP_MUSCLES: MuscleGroup[] = ['chest', 'back', 'quads', 'hamstrings', 'shoulders'];

const muscleColors: Record<MuscleGroup, string> = {
  chest: 'bg-blue-500',
  back: 'bg-purple-500',
  quads: 'bg-green-500',
  hamstrings: 'bg-orange-500',
  shoulders: 'bg-brand-500',
  biceps: 'bg-pink-500',
  triceps: 'bg-yellow-500',
  glutes: 'bg-red-500',
  calves: 'bg-teal-500',
  core: 'bg-slate-500',
  cardio: 'bg-emerald-500',
};

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo}w ago`;
}

export function VolumeChart({ weeklyVolume, weeks }: VolumeChartProps) {
  const weightUnit = useWeightUnit();
  const activeMuscles = TOP_MUSCLES.filter(
    (m) => weeklyVolume[m]?.some((v) => v > 0),
  );

  if (activeMuscles.length === 0) return null;

  const maxVol = Math.max(
    1,
    ...activeMuscles.flatMap((m) => weeklyVolume[m] ?? []),
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Weekly Volume by Muscle Group
      </h3>
      <div className="space-y-3">
        {activeMuscles.map((muscle) => {
          const weekData = weeklyVolume[muscle] ?? [];
          return (
            <div key={muscle}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${muscleColors[muscle]}`}
                  />
                  <span className="text-xs font-medium capitalize text-slate-600 dark:text-slate-400">
                    {muscle}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {formatMass(weekData[weekData.length - 1] ?? 0, weightUnit)}
                </span>
              </div>
              <div className="flex gap-1 h-8 items-end">
                {weekData.map((vol, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={`w-full rounded-sm ${muscleColors[muscle]} opacity-80 transition-all duration-500`}
                      style={{ height: `${(vol / maxVol) * 100}%`, minHeight: vol > 0 ? '3px' : '0' }}
                      title={`${getWeekLabel(weeks - 1 - i)}: ${formatWeightValue(vol, weightUnit)} ${weightUnit}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex mt-0.5">
                {weekData.map((_, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[9px] text-slate-400">
                      {getWeekLabel(weeks - 1 - i).slice(0, 1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
