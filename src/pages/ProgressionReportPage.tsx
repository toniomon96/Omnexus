import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import {
  Trophy,
  Target,
  TrendingUp,
  Share2,
  ChevronRight,
  RotateCcw,
  Zap,
  Loader2,
  Dumbbell,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { programs as builtInPrograms } from '../data/programs';
import {
  getCustomPrograms,
  getWorkoutHistory,
  getPersonalRecords,
  getProgressionReportForProgram,
  saveProgressionReportLocal,
  getWeightUnit,
} from '../utils/localStorage';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { apiBase } from '../lib/api';
import { saveProgressionReportToDb } from '../lib/db';
import type { ProgressionReport, BlockType } from '../types';
import { getBlockStartDate } from '../utils/programUtils';
import { generateProgressionReportCard, shareOrDownload } from '../utils/shareCard';

export function ProgressionReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useApp();
  const { session } = useAuth();
  const { toast } = useToast();

  const programId: string | undefined = (location.state as { programId?: string } | null)?.programId;

  const allPrograms = useMemo(() => [...builtInPrograms, ...getCustomPrograms()], []);
  const program = useMemo(() => allPrograms.find((p) => p.id === programId), [allPrograms, programId]);

  const sessions = useMemo(() => getWorkoutHistory(), []);
  const prs = useMemo(() => getPersonalRecords(), []);
  const weightUnit = getWeightUnit();

  const [report, setReport] = useState<ProgressionReport | null>(() =>
    programId ? getProgressionReportForProgram(programId) : null,
  );
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const hasFetchedNarrative = useRef(false);

  const programSessions = useMemo(
    () => sessions.filter((s) => s.programId === programId),
    [sessions, programId],
  );

  const startDate = useMemo(
    () => getBlockStartDate(programId ?? '', sessions) ?? new Date().toISOString(),
    [programId, sessions],
  );

  const endDate = useMemo(
    () =>
      programSessions.length > 0
        ? programSessions.map((s) => s.completedAt ?? s.startedAt).sort().at(-1)!
        : new Date().toISOString(),
    [programSessions],
  );

  const plannedWorkouts = useMemo(
    () => (program ? (program.estimatedDurationWeeks ?? 8) * program.daysPerWeek : 0),
    [program],
  );

  const consistencyPercent = useMemo(
    () => (plannedWorkouts > 0 ? Math.min(100, (programSessions.length / plannedWorkouts) * 100) : 0),
    [programSessions.length, plannedWorkouts],
  );

  const volumeByMuscle = useMemo(() => {
    const result: Record<string, number> = {};
    for (const s of programSessions) {
      for (const loggedEx of s.exercises) {
        const exercise = EXERCISE_LIBRARY.find((e) => e.id === loggedEx.exerciseId);
        if (!exercise) continue;
        const vol = loggedEx.sets
          .filter((set) => set.completed)
          .reduce((sum, set) => sum + set.weight * set.reps, 0);
        for (const muscle of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
          result[muscle] = (result[muscle] ?? 0) + vol;
        }
      }
    }
    return result;
  }, [programSessions]);

  const topMuscleGroup = useMemo(
    () =>
      Object.entries(volumeByMuscle).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'N/A',
    [volumeByMuscle],
  );

  const topPRs = useMemo(() => {
    if (!program || programSessions.length === 0) return [];
    const sessionIds = new Set(programSessions.map((s) => s.id));
    return prs
      .filter((pr) => {
        const session = sessions.find((s) => s.id === pr.sessionId);
        return session && sessionIds.has(session.id);
      })
      .slice(0, 5)
      .map((pr) => {
        const exercise = EXERCISE_LIBRARY.find((e) => e.id === pr.exerciseId);
        const session = sessions.find((s) => s.id === pr.sessionId);
        return {
          exerciseId: pr.exerciseId,
          exerciseName: exercise?.name ?? pr.exerciseId,
          weight: pr.weight,
          reps: pr.reps,
          date: session?.completedAt ?? session?.startedAt ?? new Date().toISOString(),
        };
      });
  }, [prs, programSessions, sessions, program]);

  useEffect(() => {
    if (!program || hasFetchedNarrative.current || (report?.omniNarrative && report.omniNarrative.length > 0)) {
      return;
    }
    hasFetchedNarrative.current = true;

    const newReport: ProgressionReport = report ?? {
      id: uuid(),
      userId: session?.user.id,
      programId: program.id,
      programName: program.name,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      consistencyPercent,
      totalWorkouts: programSessions.length,
      plannedWorkouts,
      topPRs,
      volumeByMuscle,
      omniNarrative: '',
    };

    setNarrativeLoading(true);

    const firstName = state.user?.name?.split(' ')[0] ?? '';

    fetch(`${apiBase}/api/progression-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        programName: program.name,
        startDate,
        endDate,
        consistencyPercent,
        topPRs: topPRs.map((pr) => ({ exerciseName: pr.exerciseName, weight: pr.weight, reps: pr.reps })),
        topMuscleGroup,
        totalWorkouts: programSessions.length,
      }),
    })
      .then((r) => r.json())
      .then((data: { narrative?: string }) => {
        const finalReport: ProgressionReport = {
          ...newReport,
          omniNarrative: data.narrative ?? '',
        };
        setReport(finalReport);
        saveProgressionReportLocal(finalReport);
        if (session?.user.id) {
          void saveProgressionReportToDb(finalReport, session.user.id);
        }
      })
      .catch(() => {
        const fallback = `${firstName || 'You'} completed ${programSessions.length} workouts with ${consistencyPercent.toFixed(0)}% consistency. ${topMuscleGroup} showed the strongest volume gains this block.`;
        const finalReport: ProgressionReport = { ...newReport, omniNarrative: fallback };
        setReport(finalReport);
        saveProgressionReportLocal(finalReport);
      })
      .finally(() => setNarrativeLoading(false));
  }, [program]);

  async function handleShare() {
    if (!report) return;
    setSharing(true);
    try {
      const blob = await generateProgressionReportCard({
        programName: report.programName,
        consistencyPercent: report.consistencyPercent,
        totalWorkouts: report.totalWorkouts,
        topPRs: report.topPRs,
        omniNarrative: report.omniNarrative,
        weightUnit,
      });
      await shareOrDownload(blob, `${report.programName.replace(/\s+/g, '-')}-report.png`);
    } catch {
      toast('Could not generate share card', 'error');
    } finally {
      setSharing(false);
    }
  }

  if (!program) {
    return (
      <AppShell>
        <TopBar title="Block Complete" showBack />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <Dumbbell size={48} className="text-slate-500" />
          <p className="text-slate-400 text-center">Program not found. It may have been removed.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </AppShell>
    );
  }

  const sortedMuscles = Object.entries(volumeByMuscle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const maxVolume = sortedMuscles[0]?.[1] ?? 1;

  return (
    <AppShell>
      <TopBar title="Block Complete" showBack />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto pb-8">

        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/20 mb-3">
            <Trophy size={28} className="text-brand-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{program.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Consistency + Stats */}
        <Card>
          <div className="flex items-center gap-6">
            {/* SVG Ring */}
            <div className="relative flex-shrink-0">
              <svg width={96} height={96} className="-rotate-90">
                <circle cx={48} cy={48} r={38} strokeWidth={8} stroke="#1e293b" fill="none" />
                <circle
                  cx={48}
                  cy={48}
                  r={38}
                  strokeWidth={8}
                  stroke="#6366f1"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - consistencyPercent / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{Math.round(consistencyPercent)}%</span>
                <span className="text-[10px] text-slate-400">consistency</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Workouts done</span>
                <span className="font-semibold text-white">{programSessions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Planned</span>
                <span className="font-semibold text-white">{plannedWorkouts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Top muscle</span>
                <span className="font-semibold text-white capitalize">{topMuscleGroup}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Omni Narrative */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
              <Zap size={16} className="text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">Omni Analysis</p>
              {narrativeLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating your block summary…</span>
                </div>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  {report?.omniNarrative || '—'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Volume by Muscle */}
        {sortedMuscles.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-brand-400" />
              <p className="text-sm font-semibold text-white">Volume by Muscle</p>
            </div>
            <div className="space-y-2">
              {sortedMuscles.map(([muscle, vol]) => (
                <div key={muscle}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="capitalize">{muscle}</span>
                    <span>{Math.round(vol).toLocaleString()} kg</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${(vol / maxVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top PRs */}
        {topPRs.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-amber-400" />
              <p className="text-sm font-semibold text-white">Personal Records This Block</p>
            </div>
            <div className="space-y-2">
              {topPRs.map((pr) => (
                <div key={pr.exerciseId} className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">{pr.exerciseName}</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {weightUnit === 'lbs' ? `${(pr.weight * 2.2046).toFixed(1)} lbs` : `${pr.weight} kg`} × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Share */}
        <Button
          variant="secondary"
          fullWidth
          onClick={handleShare}
          disabled={sharing || narrativeLoading}
        >
          {sharing ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Share2 size={16} className="mr-2" />
          )}
          Share Block Report
        </Button>

        {/* Continuation Options */}
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-0.5">
            What's Next?
          </p>
          <div className="space-y-2">
            <ContinuationCard
              icon={<TrendingUp size={18} className="text-brand-400" />}
              title="Continue &amp; Intensify"
              description="Build on this block with progressive overload and higher intensity."
              onClick={() =>
                navigate('/programs/ai/new', {
                  state: { blockType: 'intensification' as BlockType, predecessorProgramId: program.id },
                })
              }
            />
            <ContinuationCard
              icon={<Target size={18} className="text-emerald-400" />}
              title="Change Training Focus"
              description="Switch goals or training style for your next program block."
              onClick={() =>
                navigate('/programs/ai/new', {
                  state: { blockType: 'custom' as BlockType },
                })
              }
            />
            <ContinuationCard
              icon={<RotateCcw size={18} className="text-sky-400" />}
              title="Take a Deload Week"
              description="Recover with reduced volume before your next training block."
              onClick={() =>
                navigate('/programs/ai/new', {
                  state: { blockType: 'deload' as BlockType, predecessorProgramId: program.id },
                })
              }
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

interface ContinuationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function ContinuationCard({ icon, title, description, onClick }: ContinuationCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors flex items-center gap-3"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
    </button>
  );
}
