import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgramContextBar } from '../components/dashboard/ProgramContextBar';
import { programs } from '../data/programs';
import { getCustomPrograms } from '../utils/localStorage';
import { getNextWorkout } from '../utils/programUtils';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { getExerciseById } from '../data/exercises';
import {
  Play,
  Zap,
  Dumbbell,
  BookOpen,
  Calculator,
  Clock,
  ChevronRight,
  AlertCircle,
  Plus,
  History,
} from 'lucide-react';

export function TrainPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();

  const user = state.user;
  if (!user) return null;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user.activeProgramId) ?? null;
  const nextWorkout = program ? getNextWorkout(program) : null;
  const recentSessions = state.history.sessions.slice(0, 3);

  return (
    <AppShell>
      <TopBar title="Train" />
      <div className="px-4 pb-6 pt-4 space-y-4">

        {/* Program context */}
        {program && (
          <ProgramContextBar program={program} />
        )}

        {/* Resume active workout banner */}
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

        {/* Primary CTAs */}
        {!activeSession && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-16 flex-col gap-1 text-sm font-semibold"
              onClick={() => navigate(nextWorkout ? '/briefing' : '/workout/active')}
            >
              <Play size={20} />
              {nextWorkout ? "Today's Workout" : 'Start Workout'}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-16 flex-col gap-1 text-sm font-semibold"
              onClick={() => navigate('/workout/quick')}
            >
              <Zap size={20} />
              Quick Log
            </Button>
          </div>
        )}

        {/* Today's workout preview */}
        {nextWorkout && !activeSession && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{program?.name}</span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {nextWorkout.day.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {nextWorkout.day.exercises.slice(0, 5).map(ex => (
                <span
                  key={ex.exerciseId}
                  className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 capitalize"
                >
                  {getExerciseById(ex.exerciseId)?.name ?? ex.exerciseId.replace(/-/g, ' ')}
                </span>
              ))}
              {nextWorkout.day.exercises.length > 5 && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                  +{nextWorkout.day.exercises.length - 5} more
                </span>
              )}
            </div>
          </Card>
        )}

        {/* No program — prompt to set one up */}
        {!program && (
          <Card className="text-center py-8">
            <Dumbbell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              No program yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pick a program to get today's workout automatically
            </p>
            <Button onClick={() => navigate('/programs')}>Browse Programs</Button>
          </Card>
        )}

        {/* Quick-access tools */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Access</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/programs',               icon: Plus,       label: 'Programs'   },
              { to: '/library',                icon: BookOpen,   label: 'Exercises'  },
              { to: '/tools/plate-calculator', icon: Calculator, label: 'Plates'     },
            ].map(({ to, icon: Icon, label }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-brand-500/10 hover:text-brand-500 transition-colors text-slate-600 dark:text-slate-300"
              >
                <Icon size={20} strokeWidth={1.8} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Workouts</h3>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="flex items-center gap-1 text-xs text-brand-500 font-medium"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {recentSessions.map(session => (
                <Card key={session.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Dumbbell size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {(session as { programName?: string }).programName ?? 'Free workout'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} ·{' '}
                        {new Date(session.startedAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Clock size={15} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <History size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No workouts logged yet — start one above!
            </p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
