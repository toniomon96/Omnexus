import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Goal, Program } from '../types';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { ProgramCard } from '../components/programs/ProgramCard';
import { Card } from '../components/ui/Card';
import { programs as builtInPrograms } from '../data/programs';
import { getCustomPrograms, deleteCustomProgram } from '../utils/localStorage';
import { Plus, Sparkles, Trash2 } from 'lucide-react';

async function deleteCustomProgramFromDb(id: string) {
  const { deleteCustomProgramDb } = await import('../lib/db');
  return deleteCustomProgramDb(id);
}

const GOAL_TABS: { value: Goal | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hypertrophy', label: 'Gain Muscle' },
  { value: 'fat-loss', label: 'Lose Weight' },
  { value: 'general-fitness', label: 'Maintain' },
];

export function ProgramsPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeGoal, setActiveGoal] = useState<Goal | 'all'>('all');
  const [customPrograms, setCustomPrograms] = useState<Program[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setCustomPrograms(getCustomPrograms());
  }, []);

  const filtered =
    activeGoal === 'all'
      ? builtInPrograms
      : builtInPrograms.filter((p) => p.goal === activeGoal);

  const filteredCustom =
    activeGoal === 'all'
      ? customPrograms
      : customPrograms.filter((p) => p.goal === activeGoal);

  const draftPrograms = filteredCustom.filter((p) => p.aiLifecycleStatus === 'draft');
  const archivedPrograms = filteredCustom.filter((p) => p.aiLifecycleStatus === 'archived');
  const activeAndSavedPrograms = filteredCustom.filter((p) => p.aiLifecycleStatus !== 'draft' && p.aiLifecycleStatus !== 'archived');

  const activeProgramId = state.user?.activeProgramId;

  function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    deleteCustomProgram(id);
    setCustomPrograms(getCustomPrograms());
    setDeleteConfirm(null);
    toast('Program deleted', 'success');
    // Sync to Supabase (fire-and-forget)
    deleteCustomProgramFromDb(id).catch(() =>
      toast('Sync failed — check connection', 'error'),
    );
  }

  return (
    <AppShell>
      <TopBar title="Programs" />
      <div className="px-4 pb-6">
        {!state.user?.isGuest && (
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Card hover onClick={() => navigate('/programs/ai/new')}>
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                  <Sparkles size={18} className="text-brand-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">AI Draft</p>
                  <p className="text-xs text-slate-400 mt-0.5">Generate a new block</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/programs/builder')}>
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                  <Plus size={18} className="text-brand-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">Manual Builder</p>
                  <p className="text-xs text-slate-400 mt-0.5">Create from scratch</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Goal filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          {GOAL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveGoal(tab.value)}
              className={[
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeGoal === tab.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Programs */}
        {draftPrograms.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                AI Drafts
              </h2>
              <span className="text-xs text-slate-400">Review before starting</span>
            </div>
            <div className="space-y-3">
              {draftPrograms.map((p) => (
                <div key={p.id} className="relative">
                  <ProgramCard program={p} isActive={p.id === activeProgramId} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className={[
                      'absolute top-3 right-10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                      deleteConfirm === p.id
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-red-500',
                    ].join(' ')}
                    title={deleteConfirm === p.id ? 'Tap again to confirm delete' : 'Delete draft'}
                  >
                    <Trash2 size={12} />
                    {deleteConfirm === p.id && <span>Delete?</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAndSavedPrograms.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                My Programs
              </h2>
              {!state.user?.isGuest && (
                <button
                  onClick={() => navigate('/programs/ai/new')}
                  className="flex items-center gap-1 text-sm text-brand-500 font-medium"
                >
                  <Sparkles size={14} />
                  New AI Draft
                </button>
              )}
            </div>
            <div className="space-y-3">
              {activeAndSavedPrograms.map((p) => (
                <div key={p.id} className="relative">
                  <ProgramCard program={p} isActive={p.id === activeProgramId} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className={[
                      'absolute top-3 right-10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                      deleteConfirm === p.id
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-red-500',
                    ].join(' ')}
                    title={deleteConfirm === p.id ? 'Tap again to confirm delete' : 'Delete program'}
                  >
                    <Trash2 size={12} />
                    {deleteConfirm === p.id && <span>Delete?</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create button (when no custom programs) */}
        {customPrograms.length === 0 && (
          <Card
            hover
            onClick={() => navigate(state.user?.isGuest ? '/programs/builder' : '/programs/ai/new')}
            className="mb-5 border-2 border-dashed border-brand-200 dark:border-brand-800/40 bg-brand-50/30 dark:bg-brand-900/10"
          >
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                {state.user?.isGuest ? <Plus size={18} className="text-brand-500" /> : <Sparkles size={18} className="text-brand-500" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">
                  {state.user?.isGuest ? 'Build a Custom Program' : 'Generate an AI Program Draft'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {state.user?.isGuest ? 'Create a program tailored to your needs' : 'Review the new plan before you start it'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {archivedPrograms.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Archived AI Programs
            </h2>
            <div className="space-y-3">
              {archivedPrograms.map((p) => (
                <div key={p.id} className="relative">
                  <ProgramCard program={p} isActive={p.id === activeProgramId} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className={[
                      'absolute top-3 right-10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                      deleteConfirm === p.id
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-red-500',
                    ].join(' ')}
                    title={deleteConfirm === p.id ? 'Tap again to confirm delete' : 'Delete program'}
                  >
                    <Trash2 size={12} />
                    {deleteConfirm === p.id && <span>Delete?</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Built-in programs */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Built-in Programs
          </h2>
          {customPrograms.length > 0 && (
            <button
              onClick={() => navigate('/programs/builder')}
              className="flex items-center gap-1 text-sm text-brand-500 font-medium"
            >
              <Plus size={14} />
              New
            </button>
          )}
        </div>
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isActive={p.id === activeProgramId}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
