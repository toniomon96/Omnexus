import { useEffect, useMemo, useState } from 'react';
import type { WorkoutSession } from '../../types';
import { getExerciseSummaryMap, type ExerciseSummary } from '../../lib/staticCatalogs';
import { getWeekStart } from '../../utils/dateUtils';
import { useApp } from '../../store/AppContext';

interface MuscleHeatMapProps {
  sessions: WorkoutSession[];
}

type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

/** Each path ID maps to a display name and SVG path data */
const MUSCLE_PATHS: Record<MuscleGroup, { label: string; front?: string; back?: string }> = {
  chest: {
    label: 'Chest',
    front:
      'M 72 52 C 68 48 58 50 55 58 C 53 63 54 70 60 74 C 65 77 72 76 76 70 C 79 64 78 56 72 52 Z M 108 52 C 112 48 122 50 125 58 C 127 63 126 70 120 74 C 115 77 108 76 104 70 C 101 64 102 56 108 52 Z',
  },
  back: {
    label: 'Back',
    back:
      'M 68 52 C 68 52 60 54 58 62 C 56 70 58 82 62 88 C 66 94 74 96 80 94 C 80 94 80 74 80 62 Z M 112 52 C 112 52 120 54 122 62 C 124 70 122 82 118 88 C 114 94 106 96 100 94 C 100 94 100 74 100 62 Z',
  },
  shoulders: {
    label: 'Shoulders',
    front:
      'M 46 52 C 40 50 36 56 36 62 C 36 68 40 72 46 70 C 50 68 52 62 50 56 Z M 134 52 C 140 50 144 56 144 62 C 144 68 140 72 134 70 C 130 68 128 62 130 56 Z',
    back:
      'M 46 52 C 40 50 36 56 36 62 C 36 68 40 72 46 70 C 50 68 52 62 50 56 Z M 134 52 C 140 50 144 56 144 62 C 144 68 140 72 134 70 C 130 68 128 62 130 56 Z',
  },
  biceps: {
    label: 'Biceps',
    front:
      'M 38 70 C 34 70 30 76 30 84 C 30 92 34 100 40 100 C 44 100 48 96 48 90 C 48 80 44 70 38 70 Z M 142 70 C 146 70 150 76 150 84 C 150 92 146 100 140 100 C 136 100 132 96 132 90 C 132 80 136 70 142 70 Z',
  },
  triceps: {
    label: 'Triceps',
    back:
      'M 38 70 C 34 70 30 76 30 84 C 30 92 34 100 40 100 C 44 100 48 96 48 90 C 48 80 44 70 38 70 Z M 142 70 C 146 70 150 76 150 84 C 150 92 146 100 140 100 C 136 100 132 96 132 90 C 132 80 136 70 142 70 Z',
  },
  core: {
    label: 'Core / Abs',
    front:
      'M 72 78 L 108 78 L 108 118 L 72 118 Z',
  },
  quads: {
    label: 'Quads',
    front:
      'M 68 126 C 64 126 60 132 60 144 C 60 160 62 178 66 192 C 70 202 76 206 80 202 C 80 202 80 160 80 132 Z M 112 126 C 116 126 120 132 120 144 C 120 160 118 178 114 192 C 110 202 104 206 100 202 C 100 202 100 160 100 132 Z',
  },
  hamstrings: {
    label: 'Hamstrings',
    back:
      'M 68 126 C 64 126 60 132 60 144 C 60 160 62 178 66 192 C 70 202 76 206 80 202 C 80 202 80 160 80 132 Z M 112 126 C 116 126 120 132 120 144 C 120 160 118 178 114 192 C 110 202 104 206 100 202 C 100 202 100 160 100 132 Z',
  },
  glutes: {
    label: 'Glutes',
    back:
      'M 60 118 C 60 118 62 132 72 132 C 80 132 80 120 80 118 Z M 100 118 C 100 118 100 132 108 132 C 118 132 120 118 120 118 Z',
  },
  calves: {
    label: 'Calves',
    back:
      'M 68 200 C 66 200 62 206 62 216 C 62 228 64 240 68 246 C 72 252 76 252 78 248 C 80 244 80 230 80 216 C 80 206 76 200 68 200 Z M 112 200 C 114 200 118 206 118 216 C 118 228 116 240 112 246 C 108 252 104 252 102 248 C 100 244 100 230 100 216 C 100 206 104 200 112 200 Z',
  },
};

/** Simplified body silhouette paths */
const BODY_FRONT =
  'M 90 14 C 82 14 76 20 76 28 C 76 36 82 42 90 42 C 98 42 104 36 104 28 C 104 20 98 14 90 14 Z M 72 44 C 60 44 52 52 50 62 L 46 100 C 44 108 50 112 56 108 L 58 92 L 60 120 L 62 200 C 62 208 68 212 74 212 L 82 212 C 86 212 88 208 88 204 L 90 168 L 92 204 C 92 208 94 212 98 212 L 106 212 C 112 212 118 208 118 200 L 120 120 L 122 92 L 124 108 C 130 112 136 108 134 100 L 130 62 C 128 52 120 44 108 44 Z';

const BODY_BACK =
  'M 90 14 C 82 14 76 20 76 28 C 76 36 82 42 90 42 C 98 42 104 36 104 28 C 104 20 98 14 90 14 Z M 72 44 C 60 44 52 52 50 62 L 46 100 C 44 108 50 112 56 108 L 58 92 L 60 120 L 62 200 C 62 208 68 212 74 212 L 82 212 C 86 212 88 208 88 204 L 90 168 L 92 204 C 92 208 94 212 98 212 L 106 212 C 112 212 118 208 118 200 L 120 120 L 122 92 L 124 108 C 130 112 136 108 134 100 L 130 62 C 128 52 120 44 108 44 Z';

// Arms (front)
const ARM_FRONT_L = 'M 36 48 C 28 52 26 62 28 72 L 32 104 C 34 110 38 112 42 108 L 50 76 L 52 48 Z';
const ARM_FRONT_R = 'M 144 48 C 152 52 154 62 152 72 L 148 104 C 146 110 142 112 138 108 L 130 76 L 128 48 Z';
const LEG_LOWER_FRONT_L = 'M 62 200 L 68 200 L 70 250 L 60 250 Z';
const LEG_LOWER_FRONT_R = 'M 112 200 L 118 200 L 120 250 L 110 250 Z';

function intensityToColor(intensity: number, dark: boolean): string {
  if (intensity === 0) return dark ? '#1e293b' : '#e2e8f0';
  // Brand color scale: low → mid → high
  const r = Math.round(59 + intensity * (239 - 59));
  const g = Math.round(130 - intensity * 80);
  const b = Math.round(246 - intensity * 210);
  return `rgb(${r},${g},${b})`;
}

export function MuscleHeatMap({ sessions }: MuscleHeatMapProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';
  const weekStart = getWeekStart();
  const thisWeek = useMemo(
    () => sessions.filter((s) => s.startedAt >= weekStart),
    [sessions, weekStart],
  );
  const [exerciseSummaries, setExerciseSummaries] = useState<Record<string, ExerciseSummary>>({});

  const exerciseIds = useMemo(
    () => Array.from(new Set(thisWeek.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId)))),
    [thisWeek],
  );

  useEffect(() => {
    let cancelled = false;

    if (exerciseIds.length === 0) {
      setExerciseSummaries({});
      return () => {
        cancelled = true;
      };
    }

    void getExerciseSummaryMap(exerciseIds).then((summaries) => {
      if (!cancelled) {
        setExerciseSummaries(summaries);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [exerciseIds]);

  const counts = useMemo(() => {
    const next: Partial<Record<MuscleGroup, number>> = {};
    thisWeek.forEach((session) => {
      session.exercises.forEach((le) => {
        const ex = exerciseSummaries[le.exerciseId];
        if (!ex) return;
        const completedSets = le.sets.filter((s) => s.completed).length;
        [...ex.primaryMuscles, ...ex.secondaryMuscles].forEach((m) => {
          const key = m as MuscleGroup;
          next[key] = (next[key] ?? 0) + completedSets;
        });
      });
    });
    return next;
  }, [thisWeek, exerciseSummaries]);

  const maxCount = useMemo(() => Math.max(...Object.values(counts), 1), [counts]);
  const intensity = (m: MuscleGroup) => (counts[m] ?? 0) / maxCount;

  if (thisWeek.length === 0) return null;

  function MuscleLayer({ side }: { side: 'front' | 'back' }) {
    return (
      <>
        {(Object.keys(MUSCLE_PATHS) as MuscleGroup[]).map((muscle) => {
          const def = MUSCLE_PATHS[muscle];
          const d = side === 'front' ? def.front : def.back;
          if (!d) return null;
          const pct = intensity(muscle);
          return (
            <path
              key={muscle}
              d={d}
              fill={intensityToColor(pct, isDark)}
              opacity={0.85}
              className="dark:opacity-90 transition-all duration-500"
              style={{ fill: intensityToColor(pct, isDark) }}
            >
              <title>{def.label}: {counts[muscle] ?? 0} sets</title>
            </path>
          );
        })}
      </>
    );
  }

  const worked = (Object.keys(counts) as MuscleGroup[]).filter(
    (m) => (counts[m] ?? 0) > 0,
  );

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Muscle Activity — This Week
        </p>
        <span className="text-xs text-slate-400">{thisWeek.length} session{thisWeek.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex justify-center gap-6">
        {/* Front */}
        <div className="text-center">
          <svg
            viewBox="20 10 140 250"
            preserveAspectRatio="xMidYMid meet"
            className="w-28 h-52"
            aria-label="Front body"
          >
            {/* Silhouette */}
            <path d={BODY_FRONT} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={ARM_FRONT_L} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={ARM_FRONT_R} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={LEG_LOWER_FRONT_L} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={LEG_LOWER_FRONT_R} fill="#cbd5e1" className="dark:fill-slate-600" />
            {/* Heat */}
            <MuscleLayer side="front" />
          </svg>
          <p className="text-[10px] text-slate-400 mt-1">Front</p>
        </div>

        {/* Back */}
        <div className="text-center">
          <svg
            viewBox="20 10 140 250"
            preserveAspectRatio="xMidYMid meet"
            className="w-28 h-52"
            aria-label="Back body"
          >
            <path d={BODY_BACK} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={ARM_FRONT_L} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={ARM_FRONT_R} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={LEG_LOWER_FRONT_L} fill="#cbd5e1" className="dark:fill-slate-600" />
            <path d={LEG_LOWER_FRONT_R} fill="#cbd5e1" className="dark:fill-slate-600" />
            <MuscleLayer side="back" />
          </svg>
          <p className="text-[10px] text-slate-400 mt-1">Back</p>
        </div>
      </div>

      {/* Legend dots */}
      {worked.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {worked
            .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
            .map((m) => (
              <span key={m} className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: intensityToColor(intensity(m), isDark) }}
                />
                {MUSCLE_PATHS[m].label}
                <span className="text-slate-300 dark:text-slate-600">·{counts[m]}</span>
              </span>
            ))}
        </div>
      )}

      {/* Color scale */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-[10px] text-slate-400">Low</span>
        <div className="flex-1 h-1.5 rounded-full" style={{
          background: 'linear-gradient(to right, rgb(59,130,246), rgb(239,50,36))',
        }} />
        <span className="text-[10px] text-slate-400">High</span>
      </div>
    </div>
  );
}
