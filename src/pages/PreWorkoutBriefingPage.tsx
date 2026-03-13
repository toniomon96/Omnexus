import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Zap } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { getPreWorkoutBriefing } from '../services/claudeService';
import { exercises as exerciseData } from '../data/exercises';
import { programs } from '../data/programs';
import { getCustomPrograms } from '../utils/localStorage';
import { getNextWorkout } from '../utils/programUtils';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { formatWeightValue } from '../utils/weightUnits';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MarkdownText } from '../components/ui/MarkdownText';
import { Skeleton } from '../components/ui/Skeleton';
import { getTrainingPrimaryActionLabel } from '../lib/trainingPrimaryAction';

export function PreWorkoutBriefingPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { startWorkout } = useWorkoutSession();
  const weightUnit = useWeightUnit();

  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = state.user;
  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = user ? allPrograms.find((p) => p.id === user.activeProgramId) ?? null : null;
  const nextWorkout = program ? getNextWorkout(program) : null;
  const day = nextWorkout?.day ?? null;

  // Exercise names for today
  const exerciseNames = (day?.exercises ?? []).map((pe) => {
    const ex = exerciseData.find((e) => e.id === pe.exerciseId);
    return ex?.name ?? pe.exerciseId;
  });

  // Build recent history from session data
  const recentHistory = exerciseNames.map((name) => {
    const exId = exerciseData.find((e) => e.name === name)?.id ?? '';
    const recentSets = state.history.sessions
      .slice(-5)
      .flatMap((s) =>
        s.exercises
          .filter((le) => le.exerciseId === exId)
          .flatMap((le) =>
            le.sets
              .filter((set) => set.completed && set.weight > 0)
                .map((set) => `${formatWeightValue(set.weight, weightUnit)} ${weightUnit} x ${set.reps}`),
          ),
      )
      .slice(-3);
    return { name, recent: recentSets };
  });

  async function fetchBriefing() {
    if (!user || exerciseNames.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await getPreWorkoutBriefing({
        exerciseNames,
        recentHistory,
        userContext: { goal: user.goal, experienceLevel: user.experienceLevel },
      });
      setBriefing(res.briefing);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load briefing');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (exerciseNames.length > 0) {
      fetchBriefing();
    }
  }, []);

  function handleStart() {
    if (!program || nextWorkout === null) {
      navigate('/workout/quick');
      return;
    }
    startWorkout(program, nextWorkout.dayIndex);
    navigate('/workout/active');
  }

  return (
    <AppShell>
      <TopBar title="Pre-Workout Briefing" />
      <div className="p-4 space-y-5 pb-32">

        {/* Today's workout summary */}
        {day && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">{day.label}</h2>
            <div className="flex flex-wrap gap-2">
              {exerciseNames.map((name) => (
                <span key={name} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                  {name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* AI Briefing */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-200">AI Coach Briefing</h2>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton variant="text" className="w-11/12" />
              <Skeleton variant="text" className="w-4/5" />
              <Skeleton variant="text" className="w-3/4" />
              <p className="text-[11px] text-slate-400 pt-1">Preparing your coaching cues...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchBriefing}>Retry</Button>
            </div>
          )}

          {briefing && !loading && (
            <MarkdownText text={briefing} className="text-sm text-slate-300 leading-relaxed" />
          )}

          {!briefing && !loading && !error && (
            <p className="text-slate-500 text-sm">No workout scheduled. Head to Quick Session to pick exercises.</p>
          )}
        </Card>
      </div>

      {/* Start button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button onClick={handleStart} className="w-full flex items-center justify-center gap-2">
          <Play size={16} />
          {getTrainingPrimaryActionLabel('start_workout')}
        </Button>
      </div>
    </AppShell>
  );
}
