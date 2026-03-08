import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { DaySchedule } from '../components/programs/DaySchedule';
import { BlockMissionsCard } from '../components/programs/BlockMissionsCard';
import { GoalBadge, LevelBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { programs } from '../data/programs';
import { setUser, resetProgramCursors, getCustomPrograms, setCustomPrograms } from '../utils/localStorage';
import { generateMissions } from '../services/adaptService';
import { supabase } from '../lib/supabase';
import { upsertCustomProgram } from '../lib/db';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { applyAiProgramLifecycle } from '../utils/programLifecycle';
import { Calendar, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const { state, dispatch } = useApp();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session: activeSession } = useWorkoutSession();

  const allPrograms = [...programs, ...getCustomPrograms()];
  const program = allPrograms.find((p) => p.id === programId);
  if (!program) {
    return (
      <AppShell>
        <TopBar title="Program" showBack />
        <div className="flex items-center justify-center h-60">
          <p className="text-slate-400">Program not found.</p>
        </div>
      </AppShell>
    );
  }

  const isActive = state.user?.activeProgramId === program.id;
  const isDraft = program.aiLifecycleStatus === 'draft';
  const [roadmapOpen, setRoadmapOpen] = useState(true);

  function handleActivate() {
    if (!state.user || !program) return;
    if (activeSession) {
      toast('Finish or discard your current workout before starting a new program.', 'error');
      return;
    }

    const updatedCustomPrograms = applyAiProgramLifecycle(getCustomPrograms(), program.id, state.user.activeProgramId);
    setCustomPrograms(updatedCustomPrograms);
    updatedCustomPrograms
      .filter((candidate) => candidate.isAiGenerated)
      .forEach((candidate) => {
        if (authUser) {
          void upsertCustomProgram(candidate, authUser.id).catch(() => {});
        }
      });

    const updated = { ...state.user, activeProgramId: program.id };
    setUser(updated);
    resetProgramCursors(program.id);
    dispatch({ type: 'SET_USER', payload: updated });

    // Sync activeProgramId to Supabase so it persists across devices/sessions
    if (authUser) {
      supabase
        .from('profiles')
        .update({ active_program_id: program.id })
        .eq('id', authUser.id)
        .then(({ error }) => {
          if (error) console.warn('[ProgramDetailPage] Failed to sync activeProgramId:', error.message);
        });

      // Fire-and-forget: generate block missions for this program
      generateMissions({
        userId: authUser.id,
        programId: program.id,
        programName: program.name,
        goal: state.user.goal,
        experienceLevel: state.user.experienceLevel,
        daysPerWeek: program.daysPerWeek,
        durationWeeks: program.estimatedDurationWeeks,
      }).catch(() => {});
    }

    navigate('/');
  }

  return (
    <AppShell>
      <TopBar title={program.name} showBack />
      <div className="px-4 pb-6 space-y-5 mt-2">
        {/* Header info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <GoalBadge goal={program.goal} />
            <LevelBadge level={program.experienceLevel} />
            {program.isAiGenerated && (
              <span className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">
                <Sparkles size={10} />
                AI-Generated
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {program.description}
          </p>
          <div className="mt-3 flex gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {program.daysPerWeek} days/week
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {program.estimatedDurationWeeks} weeks
            </span>
          </div>
          {program.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {program.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 capitalize"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Training Philosophy */}
        {program.trainingPhilosophy && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
                Training Philosophy
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {program.trainingPhilosophy}
            </p>
          </div>
        )}

        {isDraft && !isActive && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              This is a draft AI program
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
              Your current program stays active until you tap Start This Program.
            </p>
          </div>
        )}

        {/* 8-Week Roadmap */}
        {program.weeklyProgressionNotes && program.weeklyProgressionNotes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setRoadmapOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  8-Week Roadmap
                </span>
              </div>
              {roadmapOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </button>
            {roadmapOpen && (
              <div className="px-4 pb-4 space-y-2">
                {program.weeklyProgressionNotes.map((note, i) => {
                  const weekNum = i + 1;
                  const isDeload = /deload/i.test(note);
                  const isPeak = weekNum === 7;
                  return (
                    <div
                      key={i}
                      className={[
                        'flex gap-3 rounded-xl px-3 py-2.5',
                        isDeload
                          ? 'bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30'
                          : isPeak
                            ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700/30'
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40',
                      ].join(' ')}
                    >
                      <span className={[
                        'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                        isDeload
                          ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300'
                          : isPeak
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                      ].join(' ')}>
                        {weekNum}
                      </span>
                      <p className={[
                        'text-sm leading-relaxed',
                        isDeload
                          ? 'text-amber-800 dark:text-amber-200'
                          : isPeak
                            ? 'text-brand-800 dark:text-brand-200'
                            : 'text-slate-600 dark:text-slate-300',
                      ].join(' ')}>
                        {note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Block Missions */}
        {authUser && (
          <BlockMissionsCard
            programId={program.id}
            programName={program.name}
            daysPerWeek={program.daysPerWeek}
            durationWeeks={program.estimatedDurationWeeks}
          />
        )}

        {/* Activate button */}
        {isActive ? (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 px-4 py-3">
            <CheckCircle2 size={18} className="text-green-500" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              This is your active program
            </p>
          </div>
        ) : (
          <Button onClick={handleActivate} fullWidth size="lg">
            {isDraft ? 'Start This Program' : 'Activate Program'}
          </Button>
        )}

        {/* Schedule */}
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-3">
            Weekly Schedule
          </h2>
          <div className="space-y-3">
            {program.schedule.map((day, i) => (
              <DaySchedule key={i} day={day} index={i} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
