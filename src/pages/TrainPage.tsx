import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { ProgramContextBar } from '../components/dashboard/ProgramContextBar';
import { programs } from '../data/programs';
import { getExerciseNameMap } from '../lib/staticCatalogs';
import { getCustomPrograms, getExperienceMode } from '../utils/localStorage';
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
  Route,
  Apple,
} from 'lucide-react';
import { trackFeatureEntry, trackPrimaryTrainingActionEvent } from '../lib/analytics';
import {
  getTrainingPrimaryActionTarget,
  resolveTrainingPrimaryActionState,
} from '../lib/trainingPrimaryAction';

export function TrainPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  const primaryActionTrackedRef = useRef<string | null>(null);

  const user = state.user;
  if (!user) return null;

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find(p => p.id === user.activeProgramId) ?? null;
  const nextWorkout = program ? getNextWorkout(program) : null;
  const recentSessions = state.history.sessions.slice(0, 3);
  const isFirstWorkout = state.history.sessions.length === 0;
  const isGuidedMode = getExperienceMode(user.id) === 'guided';
  const primaryActionState = resolveTrainingPrimaryActionState({
    hasActiveSession: Boolean(activeSession),
    hasProgramWorkout: Boolean(program && nextWorkout),
    canChooseProgram: !program,
  });

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

  useEffect(() => {
    if (!primaryActionState) return;
    const trackingKey = `${user.id}:${primaryActionState}:${isGuidedMode}`;
    if (primaryActionTrackedRef.current === trackingKey) return;

    trackPrimaryTrainingActionEvent({
      surface: 'train',
      action: 'shown',
      state: primaryActionState,
      target: getTrainingPrimaryActionTarget(primaryActionState),
      isGuidedMode,
    });
    primaryActionTrackedRef.current = trackingKey;
  }, [primaryActionState, isGuidedMode, user.id]);

  function handleTrainPrimaryAction(target: 'resume_workout' | 'start_workout' | 'browse_programs') {
    trackPrimaryTrainingActionEvent({
      surface: 'train',
      action: 'clicked',
      state: target === 'resume_workout'
        ? 'active_session'
        : target === 'start_workout'
        ? 'program_ready'
        : 'no_program',
      target,
      isGuidedMode,
    });

    if (target === 'resume_workout') {
      navigate('/workout/active');
      return;
    }
    if (target === 'start_workout') {
      navigate('/briefing');
      return;
    }
    navigate('/programs');
  }

  return (
    <AppShell>
      <TopBar title="Train" />
      <div className="px-4 pb-6 pt-4 space-y-4">

        {/* Program context */}
        {program && (
          <ProgramContextBar program={program} />
        )}

        {/* Primary action */}
        {activeSession && (
          <Card className="border-brand-400 bg-brand-50 dark:bg-brand-900/20" data-testid="train-primary-action-card">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                  Next step
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                      Resume your active workout
                    </p>
                    <p className="text-xs text-brand-700/80 dark:text-brand-300/80 mt-0.5">
                      Your session is already in progress. Finish this before starting something else.
                    </p>
                  </div>
                </div>
              </div>
              <Button size="sm" data-testid="train-primary-action-button" onClick={() => handleTrainPrimaryAction('resume_workout')}>
                <Play size={14} />
                Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Today's workout */}
        {nextWorkout && !activeSession && (
          <Card className="overflow-hidden p-0" data-testid="train-primary-action-card">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Next step
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {nextWorkout.day.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Start your guided session first. Quick Session stays available if you want something flexible instead.
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
              <div className="space-y-2">
                <Button onClick={() => handleTrainPrimaryAction('start_workout')} data-testid="train-primary-action-button">
                  <Play size={15} />
                  Start workout
                </Button>
                <Button variant="secondary" onClick={() => navigate('/workout/quick')} data-testid="train-secondary-action-button">
                  <Zap size={15} />
                  Quick Session Instead
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* No program — prompt to set one up */}
        {!program && !activeSession && (
          <Card className="py-8 text-center" data-testid="train-primary-action-card">
            <Dumbbell size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Next step
            </p>
            <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
              Choose a program first
            </p>
            <p className="mx-auto mb-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Pick a plan if you want day-by-day guidance. Quick Session is still here when you need a flexible workout right now.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => handleTrainPrimaryAction('browse_programs')} data-testid="train-primary-action-button">
                Browse Programs
              </Button>
              <Button variant="secondary" onClick={() => navigate('/workout/quick')} data-testid="train-no-program-quick-log">
                <Zap size={15} />
                Quick Session Instead
              </Button>
            </div>
          </Card>
        )}

        {/* Beginner guide */}
        {isFirstWorkout && !activeSession && (
          <Card className="border-brand-300/60 bg-brand-50/70 dark:bg-brand-900/20">
            <div className="flex items-start gap-3">
              <CircleHelp size={18} className="text-brand-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">New to workout logging?</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Start with the main action above, then use Quick Session only when you want a flexible workout.</p>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-decimal ml-4">
                  <li>Use <span className="font-semibold">Start workout</span> for your guided session when a program is ready.</li>
                  <li>Use <span className="font-semibold">Quick Session</span> when you want to build your own workout.</li>
                  <li>Enter weight and reps for each set, then tap the check button.</li>
                </ol>
              </div>
            </div>
          </Card>
        )}

        {isGuidedMode && (
          <TermHelpChips
            title="Train terms explained"
            terms={[
              {
                key: 'quick-log',
                label: 'Quick Session',
                description: 'Start a workout without a full program when you want flexibility.',
              },
              {
                key: 'guided-session',
                label: 'Guided Session',
                description: 'A workout based on your selected program with structured sets and rest.',
              },
              {
                key: 'program',
                label: 'Program',
                description: 'A multi-week training plan organized by workout days and progression.',
              },
            ]}
          />
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
                onClick={() => {
                  trackFeatureEntry({ source: 'train_tools', destination: to, label });
                  navigate(to);
                }}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              trackFeatureEntry({ source: 'train_card', destination: '/guided-pathways', label: 'guided_pathways' });
              navigate('/guided-pathways');
            }}
            className="w-full text-left"
          >
            <Card hover>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                  <Route size={18} className="text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Beginner Guided Pathways</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose goals like No Gym, Build Consistency, or Stay Active While Busy.
                  </p>
                </div>
              </div>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => {
              trackFeatureEntry({ source: 'train_card', destination: '/nutrition', label: 'nutrition_starter' });
              navigate('/nutrition');
            }}
            className="w-full text-left"
          >
            <Card hover>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Apple size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Start a Nutrition Plan</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Get beginner-friendly nutrition guidance and realistic daily steps.
                  </p>
                </div>
              </div>
            </Card>
          </button>
        </div>

      </div>
    </AppShell>
  );
}
