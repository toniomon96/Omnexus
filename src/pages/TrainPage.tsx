import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgramContextBar } from '../components/dashboard/ProgramContextBar';
import { programs } from '../data/programs';
import { getExerciseNameMap } from '../lib/staticCatalogs';
import { getCustomPrograms } from '../utils/localStorage';
import { getNextWorkout } from '../utils/programUtils';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import {
  Play,
  Zap,
  Dumbbell,
  BookOpen,
  Calculator,
  Clock,
  ChevronRight,
  AlertCircle,
  History,
  CircleHelp,
} from 'lucide-react';

export function TrainPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});

  const user = state.user;
  if (!user) return null;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user.activeProgramId) ?? null;
  const nextWorkout = program ? getNextWorkout(program) : null;
  const recentSessions = state.history.sessions.slice(0, 3);
  const isFirstWorkout = state.history.sessions.length === 0;

  useEffect(() => {
    let cancelled = false;

    if (!nextWorkout) {
      setExerciseNames({});
      return () => {
        cancelled = true;
      };
    }

    const ids = nextWorkout.day.exercises.slice(0, 5).map((exercise) => exercise.exerciseId);
    void getExerciseNameMap(ids).then((names) => {
      if (!cancelled) {
        setExerciseNames(names);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [nextWorkout]);

  return (
    <AppShell>
      <TopBar title="Train" />
      <div className="px-4 pb-6 pt-4 space-y-4">

        {/* Program context */}
        {program && (
          <ProgramContextBar program={program} />
        )}

        {/* Beginner guide */}
        {isFirstWorkout && !activeSession && (
          <Card className="border-brand-300/60 bg-brand-50/70 dark:bg-brand-900/20">
            <div className="flex items-start gap-3">
              <CircleHelp size={18} className="text-brand-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">New to workout logging?</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Start here: pick one option below, log each set, then tap Finish when done.</p>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-decimal ml-4">
                  <li>Tap <span className="font-semibold">Start workout</span> for a guided session.</li>
                  <li>Or tap <span className="font-semibold">Quick Log</span> to build your own session.</li>
                  <li>In each exercise, enter weight and reps, then tap the check button.</li>
                </ol>
              </div>
            </div>
          </Card>
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

        {/* Today's workout */}
        {nextWorkout && !activeSession && (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Today's Workout
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {nextWorkout.day.label}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{program?.name}</span>
              </div>
            </div>
            <div className="space-y-4 px-4 py-4">
              <div className="flex flex-wrap gap-1.5">
              {nextWorkout.day.exercises.slice(0, 5).map(ex => (
                <span
                  key={ex.exerciseId}
                  className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 capitalize"
                >
                  {exerciseNames[ex.exerciseId] ?? ex.exerciseId.replace(/-/g, ' ')}
                </span>
              ))}
              {nextWorkout.day.exercises.length > 5 && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                  +{nextWorkout.day.exercises.length - 5} more
                </span>
              )}
            </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => navigate('/briefing')}>
                  <Play size={15} />
                  Start workout
                </Button>
                <Button variant="secondary" onClick={() => navigate('/workout/quick')}>
                  <Zap size={15} />
                  Quick Log
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* No program — prompt to set one up */}
        {!program && !activeSession && (
          <Card className="py-8 text-center">
            <Dumbbell size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
              No program selected
            </p>
            <p className="mx-auto mb-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Start a quick workout now, or choose a program for guided day-by-day training.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate('/workout/quick')}>
                <Zap size={15} />
                Quick Log
              </Button>
              <Button variant="secondary" onClick={() => navigate('/programs')}>
                Browse Programs
              </Button>
            </div>
          </Card>
        )}

        {/* Tools */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tools</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/library',                icon: BookOpen,   label: 'Exercise Library', desc: 'Browse movement details' },
              { to: '/tools/plate-calculator', icon: Calculator, label: 'Plate Calculator', desc: 'Load the bar faster' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="rounded-2xl bg-slate-100 p-4 text-left text-slate-700 transition-colors hover:bg-brand-500/10 hover:text-brand-500 dark:bg-slate-800 dark:text-slate-300"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
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
              Your completed workouts will show up here once you finish your first session.
            </p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
