import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import { apiBase } from '../lib/api';
import type { WorkoutSession, LoggedExercise, LoggedSet, Program, BlockMission } from '../types';
import {
  setActiveSession,
  clearActiveSession,
  appendSession,
  updatePersonalRecords,
} from '../utils/localStorage';
import { calculateTotalVolume, detectPersonalRecords } from '../utils/volumeUtils';
import { advanceProgramCursor } from '../utils/programUtils';
import { trackWorkoutCompleted } from '../lib/analytics';

// ─── Block mission progress helper ────────────────────────────────────────────

async function updateBlockMissions(
  userId: string,
  programId: string,
  session: WorkoutSession,
  prs: { exerciseId: string }[],
): Promise<void> {
  try {
    const { getBlockMissions, updateMissionProgress } = await import('../lib/db');
    const missions = await getBlockMissions(userId, programId);
    if (missions.length === 0) return;

    const sessionVolume = session.exercises.reduce((total, ex) => {
      return total + ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
    }, 0);

    const completedSetsWithRpe = session.exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.completed && s.rpe !== undefined),
    );
    const avgRpe = completedSetsWithRpe.length > 0
      ? completedSetsWithRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / completedSetsWithRpe.length
      : null;

    const today = new Date().toISOString().split('T')[0];

    for (const mission of missions) {
      let delta = 0;
      let shouldUpdate = false;

      if (mission.type === 'pr' && prs.length > 0) {
        delta = prs.length;
        shouldUpdate = true;
      } else if (mission.type === 'consistency') {
        delta = 1;
        shouldUpdate = true;
      } else if (mission.type === 'volume' && sessionVolume > 0) {
        delta = sessionVolume;
        shouldUpdate = true;
      } else if (mission.type === 'rpe' && avgRpe !== null) {
        // For RPE missions, target is the max acceptable avg RPE
        // Increment current only if session avg RPE <= target
        if (avgRpe <= mission.target.value) {
          delta = 1;
          shouldUpdate = true;
        }
      }

      if (!shouldUpdate) continue;

      const newCurrent = mission.progress.current + delta;
      const newHistory = [
        ...mission.progress.history,
        { date: today, value: delta },
      ];
      const newProgress: BlockMission['progress'] = { current: newCurrent, history: newHistory };
      const newStatus: BlockMission['status'] =
        newCurrent >= mission.target.value ? 'completed' : 'active';

      await updateMissionProgress(mission.id, newProgress, newStatus);
    }
  } catch (err) {
    console.error('[useWorkoutSession] Mission progress update failed:', err);
  }
}

export function useWorkoutSession() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  const startWorkout = useCallback(
    (program: Program, dayIndex: number) => {
      const trainingDay = program.schedule[dayIndex];
      if (!trainingDay) return;

      const session: WorkoutSession = {
        id: uuid(),
        programId: program.id,
        trainingDayIndex: dayIndex,
        startedAt: new Date().toISOString(),
        exercises: trainingDay.exercises.map((pe) => ({
          exerciseId: pe.exerciseId,
          sets: Array.from({ length: pe.scheme.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            reps: 0,
            completed: false,
            timestamp: '',
          })),
        })),
        totalVolumeKg: 0,
      };

      setActiveSession(session);
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: session });
    },
    [dispatch],
  );

  const startQuickWorkout = useCallback(
    (exerciseIds: string[]) => {
      const session: WorkoutSession = {
        id: uuid(),
        programId: 'quick-log',
        trainingDayIndex: 0,
        startedAt: new Date().toISOString(),
        exercises: exerciseIds.map((exerciseId) => ({
          exerciseId,
          sets: Array.from({ length: 3 }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            reps: 0,
            completed: false,
            timestamp: '',
          })),
        })),
        totalVolumeKg: 0,
      };
      setActiveSession(session);
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: session });
    },
    [dispatch],
  );

  const updateSet = useCallback(
    (
      exerciseIdx: number,
      setIdx: number,
      data: Partial<LoggedSet>,
    ) => {
      if (!state.activeSession) return;
      const session: WorkoutSession = structuredClone(state.activeSession);
      const exercise = session.exercises[exerciseIdx];
      if (!exercise) return;
      const set = exercise.sets[setIdx];
      if (!set) return;

      const nextData: Partial<LoggedSet> = { ...data };

      if (typeof nextData.weight === 'number') {
        if (!Number.isFinite(nextData.weight) || nextData.weight < 0) {
          delete nextData.weight;
        }
      }

      if (typeof nextData.reps === 'number') {
        if (!Number.isFinite(nextData.reps) || nextData.reps < 0 || !Number.isInteger(nextData.reps)) {
          delete nextData.reps;
        }
      }

      Object.assign(set, nextData);
      if (nextData.completed) {
        set.timestamp = new Date().toISOString();
      }
      session.totalVolumeKg = calculateTotalVolume(session);
      setActiveSession(session);
      dispatch({ type: 'UPDATE_ACTIVE_SESSION', payload: session });
    },
    [state.activeSession, dispatch],
  );

  const addSet = useCallback(
    (exerciseIdx: number) => {
      if (!state.activeSession) return;
      const session: WorkoutSession = structuredClone(state.activeSession);
      const exercise = session.exercises[exerciseIdx];
      if (!exercise) return;
      exercise.sets.push({
        setNumber: exercise.sets.length + 1,
        weight: 0,
        reps: 0,
        completed: false,
        timestamp: '',
      });
      setActiveSession(session);
      dispatch({ type: 'UPDATE_ACTIVE_SESSION', payload: session });
    },
    [state.activeSession, dispatch],
  );

  const removeSet = useCallback(
    (exerciseIdx: number, setIdx: number) => {
      if (!state.activeSession) return;
      const session: WorkoutSession = structuredClone(state.activeSession);
      const exercise = session.exercises[exerciseIdx];
      if (!exercise || exercise.sets.length <= 1) return;
      exercise.sets.splice(setIdx, 1);
      exercise.sets.forEach((s, i) => { s.setNumber = i + 1; });
      setActiveSession(session);
      dispatch({ type: 'UPDATE_ACTIVE_SESSION', payload: session });
    },
    [state.activeSession, dispatch],
  );

  const addExercise = useCallback(
    (exerciseId: string) => {
      if (!state.activeSession) return;
      const session: WorkoutSession = structuredClone(state.activeSession);
      const newExercise: LoggedExercise = {
        exerciseId,
        sets: [{ setNumber: 1, weight: 0, reps: 0, completed: false, timestamp: '' }],
      };
      session.exercises.push(newExercise);
      setActiveSession(session);
      dispatch({ type: 'UPDATE_ACTIVE_SESSION', payload: session });
    },
    [state.activeSession, dispatch],
  );

  const completeWorkout = useCallback(
    (program: Program | null) => {
      if (!state.activeSession) return;
      const now = new Date().toISOString();
      const startMs = new Date(state.activeSession.startedAt).getTime();
      const durationSeconds = Math.round((Date.now() - startMs) / 1000);
      const completed: WorkoutSession = {
        ...state.activeSession,
        completedAt: now,
        durationSeconds,
        totalVolumeKg: calculateTotalVolume(state.activeSession),
      };

      const prs = detectPersonalRecords(completed, state.history);
      // Mark PR sets
      for (const pr of prs) {
        for (const loggedEx of completed.exercises) {
          if (loggedEx.exerciseId !== pr.exerciseId) continue;
          for (const set of loggedEx.sets) {
            if (set.weight === pr.weight && set.reps === pr.reps) {
              set.isPersonalRecord = true;
            }
          }
        }
      }

      appendSession(completed);
      updatePersonalRecords(prs);
      // Only advance the program cursor for scheduled workouts (not quick-log)
      if (program) advanceProgramCursor(program);
      clearActiveSession();

      dispatch({ type: 'APPEND_SESSION', payload: completed });
      dispatch({ type: 'CLEAR_ACTIVE_SESSION' });

      trackWorkoutCompleted({
        durationSeconds: completed.durationSeconds ?? 0,
        totalVolumeKg: completed.totalVolumeKg ?? 0,
        exerciseCount: completed.exercises.length,
        setCount: completed.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0),
        programId: completed.programId,
        isGuest: state.user?.isGuest ?? false,
      });

      // Sync to Supabase and notify friends (fire-and-forget)
      if (state.user && !state.user.isGuest) {
        const userId = state.user.id;
        const activeProgramId = state.user.activeProgramId;

        import('../lib/db').then(({ upsertSession, upsertPersonalRecords }) =>
          Promise.all([
            upsertSession(completed, userId),
            upsertPersonalRecords(prs, userId),
          ]),
        ).catch((err) => {
          console.error('[useWorkoutSession] Supabase sync failed:', err);
          toast('Workout saved locally, but cloud sync failed. It will retry on next login.', 'error');
        });

        import('../lib/supabase').then(({ supabase }) => supabase.auth.getSession()).then(({ data: { session } }) => {
          if (session) {
            fetch(`${apiBase}/api/notify-friends`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {});

            fetch(`${apiBase}/api/notify-progress`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {});
          }
        }).catch(() => {});

        // Update block mission progress (fire-and-forget)
        if (activeProgramId) {
          void updateBlockMissions(userId, activeProgramId, completed, prs);
        }
      }

      return { session: completed, prs };
    },
    [state.activeSession, state.history, state.user, dispatch, toast],
  );

  const discardWorkout = useCallback(() => {
    clearActiveSession();
    dispatch({ type: 'CLEAR_ACTIVE_SESSION' });
  }, [dispatch]);

  return {
    session: state.activeSession,
    startWorkout,
    startQuickWorkout,
    updateSet,
    addSet,
    removeSet,
    addExercise,
    completeWorkout,
    discardWorkout,
  };
}
