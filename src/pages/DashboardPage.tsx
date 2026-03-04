import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { TodayCard } from '../components/dashboard/TodayCard';
import { StreakDisplay } from '../components/dashboard/StreakDisplay';
import { RecoveryScoreCard } from '../components/dashboard/RecoveryScoreCard';
import { WeeklyRecapCard } from '../components/dashboard/WeeklyRecapCard';
import { MuscleHeatMap } from '../components/dashboard/MuscleHeatMap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { programs } from '../data/programs';
import { getNextWorkout } from '../utils/programUtils';
import { getProgramWeekCursor, getCustomPrograms } from '../utils/localStorage';
import { calculateStreak, getWeekStart } from '../utils/dateUtils';
import { Play, AlertCircle, AlertTriangle, UserCircle, Sparkles, Dumbbell } from 'lucide-react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';

// Dashboard is intentionally minimal — it's your daily at-a-glance view.
// Training tools (programs, library, history) live in the Train tab.
// Community (feed, leaderboard, challenges) lives in the Community tab.
// Learning content lives in the Learn tab.

export function DashboardPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();

  const user = state.user;
  if (!user) return null;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user.activeProgramId) ?? null;
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
      <TopBar
        title="Omnexus"
        right={
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => navigate('/profile')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Profile"
            >
              <UserCircle size={22} />
            </button>
          </div>
        }
      />
      <div className="px-4 pb-6 space-y-4 mt-2">

        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h2>
          {streak > 0 && (
            <p className="text-sm text-brand-500 font-medium mt-0.5">
              🔥 {streak}-day streak — keep it up!
            </p>
          )}
        </div>

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

        {/* No program — gentle prompt toward Train tab */}
        {!activeSession && !program && (
          <Card className="text-center py-6">
            <Dumbbell size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Set up a training program to see today's workout here
            </p>
            <Button onClick={() => navigate('/train')}>Get Started</Button>
          </Card>
        )}

        {/* Streak */}
        <StreakDisplay streak={streak} sessionDates={sessionDates} />

        {/* AI Insights teaser — prominent shortcut to the insights page */}
        <button onClick={() => navigate('/insights')} className="w-full text-left">
          <Card>
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

        {/* Deload warning — only when relevant */}
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
