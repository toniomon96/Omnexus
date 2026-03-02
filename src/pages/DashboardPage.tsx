import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { CurrentProgramCard } from '../components/dashboard/CurrentProgramCard';
import { TodayCard } from '../components/dashboard/TodayCard';
import { StreakDisplay } from '../components/dashboard/StreakDisplay';
import { RecoveryScoreCard } from '../components/dashboard/RecoveryScoreCard';
import { DailyLearningCard } from '../components/dashboard/DailyLearningCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { programs } from '../data/programs';
import { getNextWorkout } from '../utils/programUtils';
import { getProgramWeekCursor, getCustomPrograms } from '../utils/localStorage';
import { calculateStreak, getWeekStart } from '../utils/dateUtils';
import { Play, AlertCircle, AlertTriangle, UserCircle, Zap, Dumbbell, Ruler, Users, Utensils } from 'lucide-react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { CourseRecommendations } from '../components/learn/CourseRecommendations';
import { WeeklyRecapCard } from '../components/dashboard/WeeklyRecapCard';
import { MuscleHeatMap } from '../components/dashboard/MuscleHeatMap';
import { HealthWidget } from '../components/dashboard/HealthWidget';

export function DashboardPage() {
  const { state } = useApp();
  const navigate = useNavigate();

  const { session: activeSession } = useWorkoutSession();
  const user = state.user;
  if (!user) return null;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find((p) => p.id === user.activeProgramId) ?? null;
  const nextWorkout = program ? getNextWorkout(program) : null;
  const week = program ? getProgramWeekCursor(program.id) : 1;

  const sessionDates = state.history.sessions.map((s) => s.startedAt);
  const streak = calculateStreak(sessionDates);
  const weekStart = getWeekStart();
  const completedThisWeek = state.history.sessions.filter(
    (s) => s.startedAt >= weekStart,
  ).length;

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
        <WelcomeBanner user={user} />

        {/* Quick Actions (only when no active session) */}
        {!activeSession && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { to: '/workout/quick',       icon: Zap,      label: 'Quick Log'   },
              { to: '/tools/plate-calculator', icon: Dumbbell, label: 'Plates'   },
              { to: '/measurements',        icon: Ruler,    label: 'Measure'     },
              { to: '/feed',                icon: Users,    label: 'Community'   },
              { to: '/nutrition',           icon: Utensils, label: 'Nutrition'   },
            ].map(({ to, icon: Icon, label }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-brand-500/10 hover:text-brand-400 transition-colors text-slate-600 dark:text-slate-300"
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Recovery Score */}
        <RecoveryScoreCard sessions={state.history.sessions} />

        {/* Resume banner */}
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

        {/* Today's plan — workout + next lesson */}
        {!activeSession && (
          <TodayCard
            program={program}
            day={nextWorkout?.day ?? null}
            dayIndex={nextWorkout?.dayIndex ?? 0}
          />
        )}

        {/* Streak with 7-day history */}
        <StreakDisplay streak={streak} sessionDates={sessionDates} />

        {/* Daily Learning Snippet */}
        <DailyLearningCard goal={user.goal} />

        {/* Weekly recap */}
        <WeeklyRecapCard sessions={state.history.sessions} />

        {/* Muscle heat map */}
        <MuscleHeatMap sessions={state.history.sessions} />

        {/* Wearable health data (native only — no-op on web) */}
        <HealthWidget />

        {/* Deload week banner — shown after 4+ weeks on same program */}
        {program && week >= 4 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-900/15 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Consider a deload week
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                You've been on this program for {week}+ weeks. A deload can help recovery and prevent burnout.
              </p>
              <button
                onClick={() => navigate('/ask', { state: { prefill: 'What is a deload week and when should I take one?' } })}
                className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2"
              >
                Learn more →
              </button>
            </div>
          </div>
        )}

        {/* Current program summary */}
        {program && (
          <CurrentProgramCard
            program={program}
            week={week}
            completedThisWeek={completedThisWeek}
          />
        )}

        {!program && (
          <Card className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 mb-3">
              No active program selected
            </p>
            <Button onClick={() => navigate('/programs')}>Browse Programs</Button>
          </Card>
        )}

        {/* Personalized course recommendations */}
        <CourseRecommendations
          goal={user.goal}
          experienceLevel={user.experienceLevel}
        />
      </div>
    </AppShell>
  );
}
