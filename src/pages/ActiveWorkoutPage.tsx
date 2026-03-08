import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { ExerciseBlock } from '../components/workout/ExerciseBlock';
import { RestTimer } from '../components/workout/RestTimer';
import { WorkoutCompleteModal } from '../components/workout/WorkoutCompleteModal';
import { AddExerciseDrawer } from '../components/workout/AddExerciseDrawer';
import { PRCelebration } from '../components/workout/PRCelebration';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useRestTimer } from '../hooks/useRestTimer';
import { programs } from '../data/programs';
import { getCustomPrograms } from '../utils/localStorage';
import { formatDuration } from '../utils/dateUtils';
import type { WorkoutSession, PersonalRecord } from '../types';
import { Plus, X, StopCircle } from 'lucide-react';

export function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const {
    session,
    updateSet,
    addSet,
    removeSet,
    addExercise,
    completeWorkout,
    discardWorkout,
  } = useWorkoutSession();
  const { seconds: restSeconds, isRunning: restRunning, start: startRest, stop: stopRest } = useRestTimer();

  const [elapsed, setElapsed] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [completedData, setCompletedData] = useState<{
    session: WorkoutSession;
    prs: PersonalRecord[];
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Redirect if no active session
  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  // Elapsed timer
  useEffect(() => {
    if (!session) return;
    const start = new Date(session.startedAt).getTime();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) return null;

  const program = [...programs, ...getCustomPrograms()].find((p) => p.id === session.programId);
  const trainingDay = program?.schedule[session.trainingDayIndex];

  function handleComplete() {
    const result = completeWorkout(program ?? null);
    if (result) {
      setCompletedData(result);
      if (result.prs.length > 0) {
        setShowCelebration(true);
      }
    }
  }

  function handleDiscard() {
    setShowDiscardConfirm(true);
  }

  // Get previous session sets for reference
  function getPrevSets(exerciseId: string, setCount: number) {
    const pastSessions = state.history.sessions
      .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
    const last = pastSessions[0]?.exercises.find(
      (e) => e.exerciseId === exerciseId,
    );
    const prevSets = last?.sets.filter((s) => s.completed) ?? [];
    return Array.from({ length: setCount }, (_, i) => prevSets[i] ?? null).map(
      (s) => (s ? { weight: s.weight, reps: s.reps } : null),
    );
  }

  return (
    <>
      <AppShell hideNav>
        {/* Fixed header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {trainingDay?.label ?? 'Workout'}
            </p>
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              aria-label="Discard workout"
              className="text-slate-400"
            >
              <X size={16} />
            </Button>
            <Button variant="success" size="sm" onClick={handleComplete}>
              <StopCircle size={16} />
              Finish
            </Button>
          </div>
        </div>

        <div className="px-4 pb-32 space-y-4 mt-4">
          {session.exercises.map((loggedEx, ei) => {
            const dayEx = trainingDay?.exercises[ei];
            const restSecs = dayEx?.scheme.restSeconds ?? 90;
            const prevSets = getPrevSets(loggedEx.exerciseId, loggedEx.sets.length);

            return (
              <ExerciseBlock
                key={`${loggedEx.exerciseId}-${ei}`}
                loggedExercise={loggedEx}
                exerciseIndex={ei}
                prevSets={prevSets.filter(Boolean) as { weight: number; reps: number }[]}
                restSeconds={restSecs}
                onUpdateSet={(si, data) => updateSet(ei, si, data)}
                onAddSet={() => addSet(ei)}
                onRemoveSet={(si) => removeSet(ei, si)}
                onStartRest={() => startRest(restSecs)}
              />
            );
          })}

          {/* Add exercise */}
          <button
            onClick={() => setShowDrawer(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-4 text-sm font-medium text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            <Plus size={18} />
            Add Exercise
          </button>
        </div>
      </AppShell>

      <RestTimer
        seconds={restSeconds}
        isRunning={restRunning}
        onStop={stopRest}
      />

      <AddExerciseDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        onAdd={(id) => addExercise(id)}
      />

      {showCelebration && completedData && completedData.prs.length > 0 && (
        <PRCelebration
          prs={completedData.prs}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {completedData && !showCelebration && (
        <WorkoutCompleteModal
          open={!!completedData}
          session={completedData.session}
          prs={completedData.prs}
        />
      )}

      <ConfirmDialog
        open={showDiscardConfirm}
        title="Discard workout?"
        description="All progress will be lost. This cannot be undone."
        confirmLabel="Discard"
        variant="danger"
        onConfirm={() => { discardWorkout(); navigate('/'); }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
