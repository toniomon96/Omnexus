import { useState } from 'react';
import { Plus, Play, X } from 'lucide-react';
import type { LoggedExercise, LoggedSet } from '../../types';
import { SetRow } from './SetRow';
import { getExerciseById, getExerciseYouTubeId } from '../../data/exercises';
import { Badge } from '../ui/Badge';
import { YouTubeEmbed } from '../ui/YouTubeEmbed';

interface ExerciseBlockProps {
  loggedExercise: LoggedExercise;
  exerciseIndex: number;
  prevSets: { weight: number; reps: number }[];
  restSeconds: number;
  onUpdateSet: (setIdx: number, data: Partial<LoggedSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
  onStartRest: () => void;
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
}: ExerciseBlockProps) {
  const exercise = getExerciseById(loggedExercise.exerciseId);
  const completedCount = loggedExercise.sets.filter((s) => s.completed).length;
  const youtubeId = exercise ? getExerciseYouTubeId(exercise.id) : undefined;
  const [showDemo, setShowDemo] = useState(false);

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
                onClick={() => setShowDemo(true)}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Watch demo"
              >
                <Play size={14} />
              </button>
            )}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {completedCount}/{loggedExercise.sets.length}
            </span>
          </div>
        </div>
      </div>

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
          <SetRow
            key={si}
            set={set}
            prevSet={prevSets[si] ?? null}
            restSeconds={restSeconds}
            onUpdate={(data) => onUpdateSet(si, data)}
            onRemove={loggedExercise.sets.length > 1 ? () => onRemoveSet(si) : undefined}
            onStartRest={onStartRest}
          />
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

      {/* Demo modal */}
      {showDemo && youtubeId && exercise && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {exercise.name} — Demo
              </p>
              <button
                onClick={() => setShowDemo(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close demo"
              >
                <X size={16} />
              </button>
            </div>
            <YouTubeEmbed videoId={youtubeId} title={exercise.name} />
            <p className="text-[11px] text-slate-400 mt-2 text-center">Tutorial from YouTube</p>
          </div>
        </div>
      )}
    </div>
  );
}
