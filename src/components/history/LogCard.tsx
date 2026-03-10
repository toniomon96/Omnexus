import { useState } from 'react';
import type { WorkoutSession, LoggedSet } from '../../types';
import { programs } from '../../data/programs';
import { getCustomPrograms, updateSession } from '../../utils/localStorage';
import { formatDate, formatDuration } from '../../utils/dateUtils';
import { Card } from '../ui/Card';
import { ChevronDown, ChevronUp, Timer, Zap, Trophy, Gauge, Pencil, Check, X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass, formatWeightValue, toStoredWeight } from '../../utils/weightUnits';

interface LogCardProps {
  session: WorkoutSession;
  exerciseNames: Record<string, string>;
}

export function LogCard({ session, exerciseNames }: LogCardProps) {
  const { dispatch } = useApp();
  const { session: authSession } = useAuth();
  const weightUnit = useWeightUnit();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  // Draft edits: exerciseId -> setIndex -> { weight, reps }
  const [drafts, setDrafts] = useState<Record<string, Record<number, { weight: string; reps: string }>>>({});

  const program = [...programs, ...getCustomPrograms()].find((p) => p.id === session.programId);
  const day = program?.schedule[session.trainingDayIndex];
  const hasPRs = session.exercises.some((e) =>
    e.sets.some((s) => s.isPersonalRecord),
  );

  const rpeValues = session.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed && s.rpe != null)
    .map((s) => s.rpe as number);
  const avgRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
      : null;

  function startEditing() {
    const initial: Record<string, Record<number, { weight: string; reps: string }>> = {};
    session.exercises.forEach((ex) => {
      initial[ex.exerciseId] = {};
      ex.sets.forEach((s, i) => {
        if (s.completed) {
          initial[ex.exerciseId][i] = {
            weight: formatWeightValue(s.weight, weightUnit),
            reps: String(s.reps),
          };
        }
      });
    });
    setDrafts(initial);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDrafts({});
  }

  function saveEdits() {
    const updated: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s, i): LoggedSet => {
          const draft = drafts[ex.exerciseId]?.[i];
          if (!s.completed || !draft) return s;
          const parsedWeight = parseFloat(draft.weight);
          const weight = Number.isFinite(parsedWeight) ? toStoredWeight(parsedWeight, weightUnit) : s.weight;
          const reps = parseInt(draft.reps, 10) || s.reps;
          return { ...s, weight, reps };
        }),
      })),
    };
    // Recalculate total volume
    updated.totalVolumeKg = updated.exercises.reduce(
      (total, ex) =>
        total + ex.sets
          .filter((s) => s.completed)
          .reduce((acc, s) => acc + s.weight * s.reps, 0),
      0,
    );

    updateSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
    if (authSession?.user?.id) {
      import('../../lib/db').then(({ upsertSession }) => upsertSession(updated, authSession.user.id)).catch(() => {});
    }
    setEditing(false);
    setDrafts({});
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                {day?.label ?? 'Workout'}
              </p>
              {hasPRs && (
                <Trophy size={14} className="text-yellow-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-400">{formatDate(session.startedAt)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Timer size={12} />
              {formatDuration(session.durationSeconds ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Zap size={12} />
              {formatMass(session.totalVolumeKg, weightUnit)}
            </div>
            {avgRpe !== null && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Gauge size={12} />
                Effort {avgRpe} (RPE)
              </div>
            )}
            {expanded ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {/* Edit toolbar */}
          <div className="flex items-center justify-end px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
            {editing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={13} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdits}
                  className="flex items-center gap-1 text-xs text-brand-500 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <Check size={13} />
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {session.exercises.map((logEx) => {
              const completedSets = logEx.sets
                .map((s, i) => ({ set: s, index: i }))
                .filter(({ set }) => set.completed);
              if (completedSets.length === 0) return null;
              return (
                <div key={logEx.exerciseId} className="px-4 py-2.5">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {exerciseNames[logEx.exerciseId] ?? logEx.exerciseId}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {completedSets.map(({ set: s, index: i }) => {
                      if (editing) {
                        const draft = drafts[logEx.exerciseId]?.[i];
                        if (!draft) return null;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1"
                          >
                            <input
                              type="number"
                              inputMode="decimal"
                              value={draft.weight}
                              onChange={(e) =>
                                setDrafts((d) => ({
                                  ...d,
                                  [logEx.exerciseId]: {
                                    ...d[logEx.exerciseId],
                                    [i]: { ...draft, weight: e.target.value },
                                  },
                                }))
                              }
                              className="w-14 text-xs text-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1 py-0.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                              aria-label={`Set ${i + 1} weight in ${weightUnit}`}
                            />
                            <span className="text-xs text-slate-400">{weightUnit}x</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={draft.reps}
                              onChange={(e) =>
                                setDrafts((d) => ({
                                  ...d,
                                  [logEx.exerciseId]: {
                                    ...d[logEx.exerciseId],
                                    [i]: { ...draft, reps: e.target.value },
                                  },
                                }))
                              }
                              className="w-10 text-xs text-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1 py-0.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                              aria-label={`Set ${i + 1} reps`}
                            />
                          </div>
                        );
                      }
                      return (
                        <span
                          key={i}
                          className={[
                            'text-xs px-2 py-0.5 rounded-full',
                            s.isPersonalRecord
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 font-semibold'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                          ].join(' ')}
                        >
                          {formatWeightValue(s.weight, weightUnit)}{weightUnit}x{s.reps}
                          {s.rpe != null && ` Effort:${s.rpe}`}
                          {s.isPersonalRecord && ' 🏆'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
