import { useState } from 'react';
import { ChevronUp, Plus, Play, X } from 'lucide-react';
import type { LoggedExercise, LoggedSet } from '../../types';
import { SetRow } from './SetRow';
import { getExerciseById, getExerciseYouTubeId } from '../../data/exercises';
import { Badge } from '../ui/Badge';
import { YouTubeEmbed } from '../ui/YouTubeEmbed';
import { formatDuration } from '../../utils/dateUtils';

interface ExerciseBlockProps {
  loggedExercise: LoggedExercise;
  exerciseIndex: number;
  prevSets: { weight: number; reps: number }[];
  restSeconds: number;
  onUpdateSet: (setIdx: number, data: Partial<LoggedSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
  onStartRest: (setIndex: number) => void;
  forceShowDemo?: boolean;
  restIsRunning?: boolean;
  activeRestSeconds?: number;
  isActiveRestBlock?: boolean;
  triggerSetIndex?: number | null;
  onSkipRest?: () => void;
}

export function ExerciseBlock({
  loggedExercise,
  exerciseIndex: _exerciseIndex,
  prevSets,
  restSeconds,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onStartRest,
  forceShowDemo = false,
  restIsRunning = false,
  activeRestSeconds = 0,
  isActiveRestBlock = false,
  triggerSetIndex = null,
  onSkipRest,
}: ExerciseBlockProps) {
  const exercise = getExerciseById(loggedExercise.exerciseId);
  const completedCount = loggedExercise.sets.filter((s) => s.completed).length;
  const youtubeId = exercise ? getExerciseYouTubeId(exercise.id) : undefined;
  const [showDemo, setShowDemo] = useState(false);
  const isDemoVisible = forceShowDemo || showDemo;

  const showInlineTimer = restIsRunning && isActiveRestBlock && triggerSetIndex !== null;
  const restPct = restSeconds > 0 ? Math.min(100, ((restSeconds - activeRestSeconds) / restSeconds) * 100) : 100;

  return (
    <div data-testid="exercise-block" className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Exercise header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {exercise?.name ?? loggedExercise.exerciseId}
            </p>
            {exercise && (
              <div className="mt-1 flex flex-wrap gap-1">
                {exercise.primaryMuscles.slice(0, 2).map((m) => (
                  <Badge key={m} color="brand" size="sm">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {youtubeId && (
              <button
                onClick={() => setShowDemo((open) => !open)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-brand-500 hover:border-brand-400/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Watch demo"
              >
                {isDemoVisible ? <ChevronUp size={13} /> : <Play size={13} />}
                <span>{isDemoVisible ? 'Hide demo' : 'Show demo'}</span>
              </button>
            )}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {completedCount}/{loggedExercise.sets.length}
            </span>
          </div>
        </div>
      </div>

      {youtubeId && exercise && isDemoVisible && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick Movement Demo
            </p>
            {!forceShowDemo && (
              <button
                type="button"
                onClick={() => setShowDemo(false)}
                className="text-xs font-medium text-brand-500 hover:text-brand-400"
              >
                Hide
              </button>
            )}
          </div>
          <YouTubeEmbed videoId={youtubeId} title={exercise.name} />
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
        <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400">Set</span>
        <span className="w-16 shrink-0 text-center text-xs font-medium text-slate-400 hidden sm:block">Previous</span>
        <span className="flex-1 text-center text-xs font-medium text-slate-400">Weight</span>
        <span className="flex-1 text-center text-xs font-medium text-slate-400">Reps</span>
        <span className="w-9 shrink-0" />
        <span className="w-9 shrink-0" />
      </div>

      {/* Sets */}
      <div className="px-2 py-2 space-y-1.5">
        {loggedExercise.sets.map((set, si) => (
          <div key={si}>
            <SetRow
              set={set}
              prevSet={prevSets[si] ?? null}
              restSeconds={restSeconds}
              onUpdate={(data) => onUpdateSet(si, data)}
              onRemove={loggedExercise.sets.length > 1 ? () => onRemoveSet(si) : undefined}
              onStartRest={() => onStartRest(si)}
            />
            {showInlineTimer && triggerSetIndex === si && (
              <div className="mt-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                    Rest — Set {set.setNumber} complete
                  </p>
                  <button
                    onClick={onSkipRest}
                    className="rounded-lg p-1 text-brand-500 hover:text-brand-700 dark:hover:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                    aria-label="Skip rest"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold tabular-nums text-brand-800 dark:text-brand-200 w-12 shrink-0">
                    {formatDuration(activeRestSeconds)}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-brand-100 dark:bg-brand-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-1000"
                      style={{ width: `${restPct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={onSkipRest}
                  className="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors border border-brand-200 dark:border-brand-700"
                >
                  Skip Rest / Start Next Set
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add set button */}
      <div className="px-4 pb-3">
        <button
          onClick={onAddSet}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <Plus size={16} />
          Add Set
        </button>
      </div>

    </div>
  );
}
