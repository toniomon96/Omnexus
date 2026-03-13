import { useMemo } from 'react';
import { Activity, TrendingUp, Calendar, Dna } from 'lucide-react';
import { Card } from '../ui/Card';
import { getWorkoutHistory, getTrainingDNALocal, setTrainingDNALocal } from '../../utils/localStorage';
import { EXERCISE_LIBRARY } from '../../data/exercises';
import type { TrainingDNA } from '../../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function computeTrainingDNA(sessions: ReturnType<typeof getWorkoutHistory>): TrainingDNA {
  const dominantPatterns: Record<string, number> = {};
  const strongestMuscles: Record<string, number> = {};
  const consistencyByDay: Record<number, number> = {};
  const progressionTrend: Record<string, Array<{ date: string; weight: number }>> = {};

  for (const session of sessions) {
    const day = new Date(session.startedAt).getDay();
    consistencyByDay[day] = (consistencyByDay[day] ?? 0) + 1;

    for (const loggedEx of session.exercises) {
      const exercise = EXERCISE_LIBRARY.find((e) => e.id === loggedEx.exerciseId);
      if (!exercise) continue;

      const completedSets = loggedEx.sets.filter((s) => s.completed);
      const vol = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const maxWeight = completedSets.reduce((max, s) => Math.max(max, s.weight), 0);

      if (exercise.pattern) {
        dominantPatterns[exercise.pattern] = (dominantPatterns[exercise.pattern] ?? 0) + 1;
      }

      for (const muscle of exercise.primaryMuscles) {
        strongestMuscles[muscle] = (strongestMuscles[muscle] ?? 0) + vol;
      }

      if (maxWeight > 0) {
        if (!progressionTrend[loggedEx.exerciseId]) {
          progressionTrend[loggedEx.exerciseId] = [];
        }
        progressionTrend[loggedEx.exerciseId].push({
          date: session.startedAt,
          weight: maxWeight,
        });
      }
    }
  }

  return {
    dominantPatterns,
    strongestMuscles,
    consistencyByDay,
    progressionTrend,
    calculatedAt: new Date().toISOString(),
  };
}

export function TrainingDNA() {
  const dna = useMemo(() => {
    const cached = getTrainingDNALocal();
    if (cached) {
      const age = Date.now() - new Date(cached.calculatedAt).getTime();
      if (age < 24 * 60 * 60 * 1000) return cached;
    }
    const sessions = getWorkoutHistory();
    if (sessions.length === 0) return null;
    const computed = computeTrainingDNA(sessions);
    setTrainingDNALocal(computed);
    return computed;
  }, []);

  const sessions = useMemo(() => getWorkoutHistory(), []);

  if (!dna || sessions.length < 3) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Dna size={16} className="text-brand-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Training DNA</p>
        </div>
        <p className="text-sm text-slate-400">
          Complete at least 3 workouts to unlock your Training DNA profile.
        </p>
      </Card>
    );
  }

  const topPatterns = Object.entries(dna.dominantPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxPattern = topPatterns[0]?.[1] ?? 1;

  const topMuscles = Object.entries(dna.strongestMuscles)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxMuscle = topMuscles[0]?.[1] ?? 1;

  const maxDay = Math.max(...Object.values(dna.consistencyByDay), 1);

  const topLifts = Object.entries(dna.progressionTrend)
    .filter(([, points]) => points.length >= 2)
    .map(([exerciseId, points]) => {
      const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0]!.weight;
      const last = sorted.at(-1)!.weight;
      const gain = last - first;
      const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
      return { name: exercise?.name ?? exerciseId, gain, first, last };
    })
    .filter((l) => l.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <Dna size={16} className="text-brand-400" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Training DNA</p>
      </div>

      {/* Movement Patterns */}
      {topPatterns.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-brand-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Dominant Patterns</p>
          </div>
          <div className="space-y-2">
            {topPatterns.map(([pattern, count]) => (
              <div key={pattern}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="capitalize">{pattern.replace(/-/g, ' ')}</span>
                  <span>{count} sessions</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${(count / maxPattern) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strongest Muscles */}
      {topMuscles.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Strongest Muscles</p>
          </div>
          <div className="space-y-2">
            {topMuscles.map(([muscle, vol]) => (
              <div key={muscle}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="capitalize">{muscle}</span>
                  <span>{Math.round(vol).toLocaleString()} kg total</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{ width: `${(vol / maxMuscle) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Consistency by Day */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-sky-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Training Pattern</p>
        </div>
        <div className="flex justify-between items-end gap-1">
          {DAY_LABELS.map((label, idx) => {
            const count = dna.consistencyByDay[idx] ?? 0;
            const heightPct = maxDay > 0 ? (count / maxDay) * 100 : 0;
            return (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex flex-col justify-end" style={{ height: 48 }}>
                  <div
                    className="w-full rounded-t bg-sky-500/70"
                    style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progression Trend */}
      {topLifts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-amber-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Strength Gains</p>
          </div>
          <div className="space-y-2">
            {topLifts.map((lift) => (
              <div key={lift.name} className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-2">{lift.name}</span>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-semibold text-amber-400">+{lift.gain} kg</span>
                  <p className="text-[10px] text-slate-400">{lift.first} → {lift.last} kg</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
