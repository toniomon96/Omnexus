import { useState, useMemo, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { WorkoutSession } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LogCard } from '../components/history/LogCard';
import { VolumeChart } from '../components/history/VolumeChart';
import { HeatmapCalendar } from '../components/history/HeatmapCalendar';
import { getExerciseNameMap, getWeeklyVolumeByMuscleMap } from '../lib/staticCatalogs';
import { Clock, List, Calendar, Play } from 'lucide-react';
import type { MuscleGroup } from '../types';

function createEmptyWeeklyVolume(): Record<MuscleGroup, number[]> {
  return {
    chest: [],
    back: [],
    shoulders: [],
    biceps: [],
    triceps: [],
    quads: [],
    hamstrings: [],
    glutes: [],
    calves: [],
    core: [],
    cardio: [],
  };
}

const SessionList = memo(function SessionList({ sessions }: { sessions: WorkoutSession[] }) {
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(
      new Set(sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId))),
    );

    if (ids.length === 0) {
      setExerciseNames({});
      return () => {
        cancelled = true;
      };
    }

    void getExerciseNameMap(ids).then((names) => {
      if (!cancelled) {
        setExerciseNames(names);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessions]);

  const cards = useMemo(
    () => sessions.map((s) => <LogCard key={s.id} session={s} exerciseNames={exerciseNames} />),
    [exerciseNames, sessions],
  );
  return <div className="space-y-2">{cards}</div>;
});

export function HistoryPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [ready, setReady] = useState(false);
  const [weeklyVolume, setWeeklyVolume] = useState<Record<MuscleGroup, number[]>>(() => createEmptyWeeklyVolume());
  useEffect(() => { setReady(true); }, []);
  const sessions = [...state.history.sessions].reverse();
  const totalSessions = state.history.sessions.length;
  const totalVolume = state.history.sessions.reduce(
    (t, s) => t + s.totalVolumeKg,
    0,
  );
  const [prExerciseNames, setPrExerciseNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(
      new Set(state.history.personalRecords.slice(0, 5).map((record) => record.exerciseId)),
    );

    if (ids.length === 0) {
      setPrExerciseNames({});
      return () => {
        cancelled = true;
      };
    }

    void getExerciseNameMap(ids).then((names) => {
      if (!cancelled) {
        setPrExerciseNames(names);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state.history.personalRecords]);

  useEffect(() => {
    let cancelled = false;

    void getWeeklyVolumeByMuscleMap(state.history, 4).then((volume) => {
      if (!cancelled) {
        setWeeklyVolume(volume);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state.history]);

  return (
    <AppShell>
      <TopBar
        title="History"
        right={
          totalSessions > 0 ? (
            <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                aria-label="Calendar view"
              >
                <Calendar size={16} />
              </button>
            </div>
          ) : null
        }
      />
      <div className="px-4 pb-6 mt-2 space-y-4">
        {!ready && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
          </>
        )}
        {ready && totalSessions > 0 ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalSessions}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Total Workouts</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {(totalVolume / 1000).toFixed(1)}t
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Total Volume</p>
              </Card>
            </div>

            {/* PRs */}
            {state.history.personalRecords.length > 0 && (
              <Card>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  🏆 Personal Records
                </h2>
                <div className="space-y-2">
                  {state.history.personalRecords.slice(0, 5).map((pr) => {
                    return (
                      <div
                        key={pr.exerciseId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {prExerciseNames[pr.exerciseId] ?? pr.exerciseId}
                        </span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400 ml-2 shrink-0">
                          {pr.weight}kg × {pr.reps}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {view === 'calendar' ? (
              /* Calendar view */
              <Card className="p-4">
                <HeatmapCalendar sessions={state.history.sessions} />
              </Card>
            ) : (
              <>
                {/* Volume chart */}
                {sessions.length >= 2 && (
                  <Card>
                    <VolumeChart weeklyVolume={weeklyVolume} weeks={4} />
                  </Card>
                )}

                {/* Session list */}
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Workout Log
                </h2>
                <SessionList sessions={sessions} />
              </>
            )}
          </>
        ) : ready ? (
          <EmptyState
            icon={<Clock size={40} />}
            title="No workout history yet"
            description="Finish your first session and your log, volume trends, and personal records will show up here."
            action={
              <Button onClick={() => navigate('/train')}>
                <Play size={15} />
                Go to Train
              </Button>
            }
          />
        ) : null}
      </div>
    </AppShell>
  );
}
