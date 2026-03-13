import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import { apiBase } from '../lib/api';
import type { WorkoutSession, LoggedExercise, LoggedSet, Program, BlockMission, PersonalRecord } from '../types';
import {
  setActiveSession,
  clearActiveSession,
  appendSession,
  updateSessionSyncStatus,
  updatePersonalRecords,
  getGamificationData,
} from '../utils/localStorage';
import { calculateTotalVolume, detectPersonalRecords } from '../utils/volumeUtils';
import { advanceProgramCursor } from '../utils/programUtils';
import { trackWorkoutCompleted } from '../lib/analytics';
import { getSessionPersonalRecords } from '../utils/workoutSync';
import { getSafeMissionCurrentValue, getSafeMissionTargetValue } from '../lib/missionUtils';
import { computeNewStreak } from '../utils/streakUtils';

function safeInitialSetCount(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(Math.max(Math.round(numeric), 1), 8);
}

export function sanitizeMissionProgressHistory(
  history: Array<{ date: string; value: number }>,
  maxEntries = 60,
): Array<{ date: string; value: number }> {
  return history
    .filter((entry) => typeof entry?.date === 'string' && entry.date.length > 0)
    .map((entry) => {
      const numeric = Number(entry.value);
      return {
        date: entry.date,
        value: Number.isFinite(numeric) && numeric > 0 ? numeric : 0,
      };
    })
    .slice(-Math.max(1, Math.round(maxEntries)));
}

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
        if (avgRpe <= getSafeMissionTargetValue(mission)) {
          delta = 1;
          shouldUpdate = true;
        }
      }

      if (!shouldUpdate) continue;

      const safeDelta = Number.isFinite(delta) && delta > 0 ? delta : 0;
      if (safeDelta <= 0) continue;

      const newCurrent = getSafeMissionCurrentValue(mission) + safeDelta;
      const existingHistory = sanitizeMissionProgressHistory(mission.progress.history);
      const newHistory = sanitizeMissionProgressHistory([
        ...existingHistory,
        { date: today, value: safeDelta },
      ]);
      const newProgress: BlockMission['progress'] = { current: newCurrent, history: newHistory };
      const newStatus: BlockMission['status'] =
        newCurrent >= getSafeMissionTargetValue(mission) ? 'completed' : 'active';

      await updateMissionProgress(mission.id, newProgress, newStatus);
    }
  } catch (err) {
    console.error('[useWorkoutSession] Mission progress update failed:', err);
  }
}

export function useWorkoutSession() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  const syncWorkoutToCloud = useCallback(
    async (
      session: WorkoutSession,
      prs: PersonalRecord[],
      options?: { onSuccess?: () => void; onError?: () => void; successMessage?: string; errorMessage?: string },
    ) => {
      if (!state.user || state.user.isGuest) {
        return { ok: false as const, reason: 'missing-auth' as const };
      }

      const syncingSession = updateSessionSyncStatus(session.id, 'syncing');
      if (syncingSession) {
        dispatch({ type: 'UPDATE_SESSION', payload: syncingSession });
      }

      try {
        const { upsertSession, upsertPersonalRecords } = await import('../lib/db');
        await Promise.all([
          upsertSession(session, state.user.id),
          upsertPersonalRecords(prs, state.user.id),
        ]);

        const syncedSession = updateSessionSyncStatus(session.id, 'synced');
        if (syncedSession) {
          dispatch({ type: 'UPDATE_SESSION', payload: syncedSession });
        }

        options?.onSuccess?.();
        if (options?.successMessage) {
          toast(options.successMessage, 'success');
        }

        return { ok: true as const };
      } catch (err) {
        console.error('[useWorkoutSession] Supabase sync failed:', err);
        const failedSession = updateSessionSyncStatus(session.id, 'needs_attention');
        if (failedSession) {
          dispatch({ type: 'UPDATE_SESSION', payload: failedSession });
        }

        options?.onError?.();
        toast(options?.errorMessage ?? 'Workout saved locally, but cloud sync needs attention.', 'error');
        return { ok: false as const, reason: 'sync-failed' as const };
      }
    },
    [dispatch, state.user, toast],
  );

  const startWorkout = useCallback(
    (program: Program, dayIndex: number) => {
      const trainingDay = program.schedule[dayIndex];
      if (!trainingDay) {
        toast('That workout day could not be loaded. Please pick another day.', 'error');
        return;
      }

      const normalizedExercises = trainingDay.exercises
        .filter((exercise) => typeof exercise.exerciseId === 'string' && exercise.exerciseId.length > 0)
        .map((exercise) => ({
          exerciseId: exercise.exerciseId,
          sets: Array.from({ length: safeInitialSetCount(exercise.scheme?.sets) }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            reps: 0,
            completed: false,
            timestamp: '',
          })),
        }));

      if (normalizedExercises.length === 0) {
        toast('This workout day is invalid. Regenerate your program draft and try again.', 'error');
        return;
      }

      const session: WorkoutSession = {
        id: uuid(),
        programId: program.id,
        trainingDayIndex: dayIndex,
        startedAt: new Date().toISOString(),
        exercises: normalizedExercises,
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
        syncStatus: state.user && !state.user.isGuest ? 'syncing' : 'saved_on_device',
        syncStatusUpdatedAt: now,
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

      // Award XP for workout completion and any personal records
      dispatch({ type: 'AWARD_XP', payload: { eventType: 'workout_completed', referenceId: completed.id } });
      for (const pr of prs) {
        dispatch({ type: 'AWARD_XP', payload: { eventType: 'pr_achieved', referenceId: pr.exerciseId } });
      }

      // Update streak (workout counts as daily activity)
      const { streak, streakUpdatedDate } = getGamificationData();
      const { newStreak, isNewDay, hitMilestone } = computeNewStreak(streak, streakUpdatedDate);
      if (isNewDay) {
        dispatch({ type: 'SET_STREAK', payload: newStreak });
        if (hitMilestone) {
          dispatch({ type: 'AWARD_XP', payload: { eventType: 'streak_milestone' } });
          dispatch({ type: 'AWARD_SPARKS', payload: 10 });
        }
      }

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

        void syncWorkoutToCloud(completed, prs);

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

  const retryWorkoutSync = useCallback(
    async (sessionId: string) => {
      if (!state.user || state.user.isGuest) {
        toast('Sign in to retry cloud sync for this workout.', 'info');
        return { ok: false as const, reason: 'missing-auth' as const };
      }

      const sessionToRetry = state.history.sessions.find((entry) => entry.id === sessionId);
      if (!sessionToRetry) {
        toast('We could not find that workout to retry.', 'error');
        return { ok: false as const, reason: 'missing-session' as const };
      }

      const prs = getSessionPersonalRecords(sessionId, state.history.personalRecords);
      return syncWorkoutToCloud(sessionToRetry, prs, {
        successMessage: 'Workout sync completed.',
        errorMessage: 'Workout is still saved locally, but cloud sync needs attention.',
      });
    },
    [state.user, state.history.sessions, state.history.personalRecords, syncWorkoutToCloud, toast],
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
    retryWorkoutSync,
    discardWorkout,
  };
}
