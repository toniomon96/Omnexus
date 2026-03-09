import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { TodayCard } from '../components/dashboard/TodayCard';
import { StreakDisplay } from '../components/dashboard/StreakDisplay';
import { RecoveryScoreCard } from '../components/dashboard/RecoveryScoreCard';
import { WeeklyRecapCard } from '../components/dashboard/WeeklyRecapCard';
import { MuscleHeatMap } from '../components/dashboard/MuscleHeatMap';
import { ProgramContextBar } from '../components/dashboard/ProgramContextBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { programs } from '../data/programs';
import { getNextWorkout } from '../utils/programUtils';
import { getProgramWeekCursor, getCustomPrograms, setUser } from '../utils/localStorage';
import { calculateStreak, getWeekStart } from '../utils/dateUtils';
import {
  Play,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useProgramGeneration } from '../hooks/useProgramGeneration';
import { clearGenerationState, getGenerationState, startGeneration } from '../lib/programGeneration';
import { supabase } from '../lib/supabase';
import { formatDuration } from '../utils/dateUtils';
import { applyAiProgramLifecycle } from '../utils/programLifecycle';
import { setCustomPrograms } from '../utils/localStorage';
import { upsertCustomProgram } from '../lib/db';

export function DashboardPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();
  const { status: genStatus, programId: generatedProgramId, generationState } = useProgramGeneration();
  const repairedMissingProgramRef = useRef(false);

  const user = state.user;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user?.activeProgramId) ?? null;
  const generatedProgramExists = generatedProgramId
    ? allPrograms.some((p) => p.id === generatedProgramId)
    : false;

  // When generation completes: activate the program on the user
  useEffect(() => {
    if (!user) return;
    if (!generationState?.activateOnReady) return;
    if (genStatus !== 'ready' || !generatedProgramId || user.activeProgramId === generatedProgramId) return;

    const updated = { ...user, activeProgramId: generatedProgramId };
    setUser(updated);
    dispatch({ type: 'SET_USER', payload: updated });

    const nextPrograms = applyAiProgramLifecycle(allPrograms, generatedProgramId, user.activeProgramId)
      .filter((p) => p.isCustom);
    setCustomPrograms(nextPrograms);
    nextPrograms
      .filter((program) => program.isAiGenerated)
      .forEach((program) => {
        void upsertCustomProgram(program, user.id).catch(() => {});
      });

    supabase
      .from('profiles')
      .update({ active_program_id: generatedProgramId })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('[Dashboard] Failed to sync activeProgramId:', error.message);
      });

    const t = setTimeout(() => clearGenerationState(), 8000);
    return () => clearTimeout(t);
  }, [genStatus, generatedProgramId, generationState?.activateOnReady, user, dispatch]);

  // Self-heal older stuck accounts where a stale local "ready" flag exists but
  // the generated program record never made it to localStorage/Supabase.
  useEffect(() => {
    if (!user || genStatus !== 'ready' || !generatedProgramId) return;

    if (generatedProgramExists) {
      repairedMissingProgramRef.current = false;
      return;
    }

    if (repairedMissingProgramRef.current) return;
    repairedMissingProgramRef.current = true;

    const stored = getGenerationState();
    if (!stored || stored.userId !== user.id) {
      clearGenerationState();
      return;
    }

    console.warn('[Dashboard] Ready generation state had no matching program. Restarting generation recovery.');
    void startGeneration(user.id, stored.profile).catch((err) => {
      console.error('[Dashboard] Program recovery failed:', err);
      repairedMissingProgramRef.current = false;
    });
  }, [genStatus, generatedProgramId, generatedProgramExists, user]);

  if (!user) return null;

  const nextWorkout = program ? getNextWorkout(program) : null;
  const week = program ? getProgramWeekCursor(program.id) : 1;

  const sessionDates = state.history.sessions.map(s => s.startedAt);
  const streak = calculateStreak(sessionDates);
  const weekStart = getWeekStart();
  const completedThisWeek = state.history.sessions.filter(s => s.startedAt >= weekStart).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] ?? 'there';

  // Last completed workout for continuity signal
  const lastSession = state.history.sessions.length > 0
    ? state.history.sessions[state.history.sessions.length - 1]
    : null;

  function retryGeneration() {
    if (!user) return;
    const stored = getGenerationState();
    if (!stored) return;
    void startGeneration(user.id, stored.profile);
  }

  return (
    <AppShell>
      <TopBar title="Omnexus" />

      <div className="px-4 pb-6 space-y-4 mt-2">

        {/* ── Greeting + Program Context ─────────────────────────────── */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h2>
          {streak > 0 && (
            <p className="text-sm text-brand-500 font-medium">
              {streak}-day streak — keep it up!
            </p>
          )}
          {program && (
            <ProgramContextBar program={program} className="mt-1" />
          )}
        </div>

        {/* ── Program ready banner ──────────────────────────────────── */}
        {genStatus === 'ready' && generatedProgramId && generatedProgramExists && generationState?.activateOnReady && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Your personalized program is ready!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Your AI-designed 8-week plan is now active.
              </p>
            </div>
            <Link
              to={`/programs/${generatedProgramId}`}
              className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View →
            </Link>
          </div>
        )}

        {genStatus === 'ready' && generatedProgramId && !generatedProgramExists && generationState?.activateOnReady && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-900/15 dark:border-amber-700/40 px-4 py-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Restoring your personalized program
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                We found an older incomplete generation state and are rebuilding your program now.
              </p>
            </div>
          </div>
        )}

        {/* ── Generation error state ────────────────────────────────── */}
        {genStatus === 'error' && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-300/50 bg-red-50 dark:bg-red-900/15 dark:border-red-700/40 px-4 py-3">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Program generation failed
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                We couldn't build your program. Tap retry to try again.
              </p>
            </div>
            <button
              type="button"
              onClick={retryGeneration}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* ── Resume active workout ─────────────────────────────────── */}
        {activeSession && (
          <Card className="border-brand-400 bg-brand-50 dark:bg-brand-900/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-brand-500 shrink-0" />
                <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                  Workout in progress
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/workout/active')}>
                <Play size={14} />
                Resume
              </Button>
            </div>
          </Card>
        )}

        {/* ── PRIMARY: Today's Workout ──────────────────────────────── */}
        {!activeSession && program && nextWorkout && (
          <TodayCard
            program={program}
            day={nextWorkout.day}
            dayIndex={nextWorkout.dayIndex}
          />
        )}

        {/* ── Subtle generating placeholder (no spinner card) ──────── */}
        {!activeSession && !program && genStatus === 'generating' && (
          <Card className="border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 animate-pulse">
                <Dumbbell size={18} className="text-slate-300 dark:text-slate-600" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-40 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-2.5 w-28 rounded-full bg-slate-100 dark:bg-slate-700/60 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              Building your program in the background…
            </p>
          </Card>
        )}

        {/* ── No program — prompt to get started ───────────────────── */}
        {!activeSession && !program && genStatus !== 'generating' && genStatus !== 'error' && (
          <Card className="text-center py-6">
            <Dumbbell size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Set up a training program to unlock your first guided session here
            </p>
            <Button onClick={() => navigate('/train')}>Get Started</Button>
          </Card>
        )}

        {/* ── Continuity: last workout + program progress ───────────── */}
        {program && lastSession && !activeSession && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <RotateCcw size={12} className="text-slate-400" />
              <span>Last workout</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {new Date(lastSession.startedAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {lastSession.durationSeconds && (
                <span>· {formatDuration(lastSession.durationSeconds)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-brand-500 font-medium hover:underline"
            >
              History →
            </button>
          </div>
        )}

        {/* ── Streak ───────────────────────────────────────────────── */}
        <StreakDisplay streak={streak} sessionDates={sessionDates} />

        {/* ── AI Insights teaser ────────────────────────────────────── */}
        <button type="button" onClick={() => navigate('/insights')} className="w-full text-left">
          <Card hover>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Insights</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {completedThisWeek > 0
                    ? `${completedThisWeek} workout${completedThisWeek !== 1 ? 's' : ''} this week — tap for your analysis`
                    : 'Log workouts to unlock personalized AI recommendations'}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-500 shrink-0">View →</span>
            </div>
          </Card>
        </button>

        {/* ── Recovery score ────────────────────────────────────────── */}
        <RecoveryScoreCard sessions={state.history.sessions} />

        {/* ── Muscle heat map ───────────────────────────────────────── */}
        <MuscleHeatMap sessions={state.history.sessions} />

        {/* ── Weekly recap ──────────────────────────────────────────── */}
        <WeeklyRecapCard sessions={state.history.sessions} />

        {/* ── Deload warning ────────────────────────────────────────── */}
        {program && week >= 4 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-900/15 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Consider a deload week
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {week}+ weeks on the same program. A deload helps recovery and prevents burnout.
              </p>
              <button
                onClick={() =>
                  navigate('/ask', {
                    state: { prefill: 'What is a deload week and when should I take one?' },
                  })
                }
                type="button"
                className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2"
              >
                Ask Omnexus →
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
