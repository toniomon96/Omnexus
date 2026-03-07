import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { TodayCard } from '../components/dashboard/TodayCard';
import { StreakDisplay } from '../components/dashboard/StreakDisplay';
import { RecoveryScoreCard } from '../components/dashboard/RecoveryScoreCard';
import { WeeklyRecapCard } from '../components/dashboard/WeeklyRecapCard';
import { MuscleHeatMap } from '../components/dashboard/MuscleHeatMap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { programs } from '../data/programs';
import { getNextWorkout } from '../utils/programUtils';
import { getProgramWeekCursor, getCustomPrograms, setUser } from '../utils/localStorage';
import { calculateStreak, getWeekStart } from '../utils/dateUtils';
import { Play, AlertCircle, AlertTriangle, Sparkles, Dumbbell, Loader2, CheckCircle2 } from 'lucide-react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useProgramGeneration } from '../hooks/useProgramGeneration';
import { clearGenerationState } from '../lib/programGeneration';
import { supabase } from '../lib/supabase';

// Dashboard is intentionally minimal — it's your daily at-a-glance view.
// Training tools (programs, library, history) live in the Train tab.
// Community (feed, leaderboard, challenges) lives in the Community tab.
// Learning content lives in the Learn tab.

export function DashboardPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();
  const { status: genStatus, programId: generatedProgramId } = useProgramGeneration();

  const user = state.user;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user?.activeProgramId) ?? null;

  // When generation completes: activate the program on the user
  useEffect(() => {
    if (!user) return;
    if (genStatus !== 'ready' || !generatedProgramId || user.activeProgramId === generatedProgramId) return;

    // Update local state
    const updated = { ...user, activeProgramId: generatedProgramId };
    setUser(updated);
    dispatch({ type: 'SET_USER', payload: updated });

    // Sync to Supabase (best-effort)
    supabase
      .from('profiles')
      .update({ active_program_id: generatedProgramId })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('[Dashboard] Failed to sync activeProgramId:', error.message);
      });

    // Clear generation state after a delay so the "ready" banner shows briefly
    const t = setTimeout(() => clearGenerationState(), 8000);
    return () => clearTimeout(t);
  }, [genStatus, generatedProgramId, user, dispatch]);

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

  return (
    <AppShell>
      {/* TopBar default: shows ThemeToggle + Avatar profile link automatically */}
      <TopBar title="Omnexus" />

      <div className="px-4 pb-6 space-y-4 mt-2">

        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h2>
          {streak > 0 && (
            <p className="text-sm text-brand-500 font-medium mt-0.5">
              {streak}-day streak — keep it up!
            </p>
          )}
        </div>

        {/* Program ready celebration banner */}
        {genStatus === 'ready' && generatedProgramId && (
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

        {/* Program generating card */}
        {genStatus === 'generating' && (
          <Card className="border-brand-300/50 bg-brand-50/80 dark:bg-brand-900/15 dark:border-brand-700/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                <Loader2 size={20} className="text-brand-500 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Building your training program…
                </p>
                <p className="text-xs text-brand-600/80 dark:text-brand-400/80 mt-0.5">
                  Your personalized 8-week plan is generating. Explore the app in the meantime.
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-brand-200/60 dark:bg-brand-800/40 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-brand-500 animate-pulse" />
            </div>
          </Card>
        )}

        {/* Resume active workout */}
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

        {/* Today's workout (only when not mid-session) */}
        {!activeSession && program && (
          <TodayCard
            program={program}
            day={nextWorkout?.day ?? null}
            dayIndex={nextWorkout?.dayIndex ?? 0}
          />
        )}

        {/* No program — show skeleton if generating, otherwise prompt */}
        {!activeSession && !program && genStatus !== 'generating' && (
          <Card className="text-center py-6">
            <Dumbbell size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Set up a training program to see today's workout here
            </p>
            <Button onClick={() => navigate('/train')}>Get Started</Button>
          </Card>
        )}

        {/* Program skeleton while generating */}
        {!program && genStatus === 'generating' && (
          <Card>
            <div className="space-y-3">
              <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-48 rounded-full bg-slate-100 dark:bg-slate-700/60 animate-pulse" />
              <div className="h-3 w-40 rounded-full bg-slate-100 dark:bg-slate-700/60 animate-pulse" />
            </div>
          </Card>
        )}

        {/* Streak */}
        <StreakDisplay streak={streak} sessionDates={sessionDates} />

        {/* AI Insights teaser */}
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

        {/* Recovery score */}
        <RecoveryScoreCard sessions={state.history.sessions} />

        {/* Muscle heat map */}
        <MuscleHeatMap sessions={state.history.sessions} />

        {/* Weekly recap */}
        <WeeklyRecapCard sessions={state.history.sessions} />

        {/* Deload warning */}
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
