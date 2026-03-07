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
import { getWeeklyVolumeByMuscle } from '../utils/volumeUtils';
import { getExerciseById } from '../data/exercises';
import { Clock, List, Calendar, Play } from 'lucide-react';

const SessionList = memo(function SessionList({ sessions }: { sessions: WorkoutSession[] }) {
  const cards = useMemo(
    () => sessions.map((s) => <LogCard key={s.id} session={s} />),
    [sessions],
  );
  return <div className="space-y-2">{cards}</div>;
});

export function HistoryPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const sessions = [...state.history.sessions].reverse();
  const weeklyVolume = getWeeklyVolumeByMuscle(state.history, 4);
  const totalSessions = state.history.sessions.length;
  const totalVolume = state.history.sessions.reduce(
    (t, s) => t + s.totalVolumeKg,
    0,
  );

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
                    const ex = getExerciseById(pr.exerciseId);
                    return (
                      <div
                        key={pr.exerciseId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {ex?.name ?? pr.exerciseId}
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
            title="No workouts yet"
            description="Complete your first workout to start building your history. Every session counts."
            action={
              <Button onClick={() => navigate('/train')}>
                <Play size={15} />
                Start your first workout
              </Button>
            }
          />
        ) : null}
      </div>
    </AppShell>
  );
}
