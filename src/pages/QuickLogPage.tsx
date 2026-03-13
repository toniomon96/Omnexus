import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Zap, Save, X, Check } from 'lucide-react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { exercises } from '../data/exercises';
import type { WorkoutTemplate } from '../types';
import { getWorkoutTemplates, saveWorkoutTemplate } from '../utils/localStorage';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/exercise-library/SearchBar';
import { Card } from '../components/ui/Card';
import { getTrainingPrimaryActionLabel, QUICK_SESSION_LABEL } from '../lib/trainingPrimaryAction';

export function QuickLogPage() {
  const { startQuickWorkout } = useWorkoutSession();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates] = useState<WorkoutTemplate[]>(() => getWorkoutTemplates());

  useEffect(() => {
    const preselectedExerciseId = (location.state as { preselectedExerciseId?: string } | null)?.preselectedExerciseId;
    if (!preselectedExerciseId) return;

    setSelectedIds((prev) => (prev.includes(preselectedExerciseId) ? prev : [...prev, preselectedExerciseId]));

    // Remove one-time state so browser back/forward doesn't repeatedly re-add.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filtered = useMemo(() =>
    exercises.filter((ex) =>
      !query ||
      ex.name.toLowerCase().includes(query.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(query.toLowerCase())),
    ),
    [query],
  );

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function loadTemplate(template: WorkoutTemplate) {
    setSelectedIds(template.exercises.map((e) => e.exerciseId));
  }

  function handleStart() {
    if (selectedIds.length === 0) return;

    if (saveAsTemplate && templateName.trim()) {
      const template: WorkoutTemplate = {
        id: uuid(),
        userId: '',
        name: templateName.trim(),
        exercises: selectedIds.map((exerciseId) => ({
          exerciseId,
          sets: 3,
          reps: 10,
          restSeconds: 90,
        })),
        createdAt: new Date().toISOString(),
      };
      saveWorkoutTemplate(template);
    }

    startQuickWorkout(selectedIds);
    navigate('/workout/active');
  }

  return (
    <AppShell>
      <TopBar title={QUICK_SESSION_LABEL} />
      <div className="p-4 space-y-5 pb-32">

        {/* Beginner instructions */}
        <Card className="border-brand-300/60 bg-brand-50/70 dark:bg-brand-900/20">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">How {QUICK_SESSION_LABEL} Works</h2>
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-decimal ml-4">
            <li>Search and tap exercises to add them.</li>
            <li>Tap <span className="font-semibold">{getTrainingPrimaryActionLabel('start_workout')}</span>.</li>
            <li>Enter weight and reps for each set, then tap <span className="font-semibold">Finish</span>.</li>
          </ol>
        </Card>

        {/* Templates */}
        {templates.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Templates</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className="flex-shrink-0 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-200 hover:bg-brand-500/20 hover:text-brand-400 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {t.name}
                  <span className="ml-1.5 text-slate-500 text-xs">{t.exercises.length}ex</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Exercise search */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Select Exercises</h2>
          <SearchBar value={query} onChange={setQuery} />
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {filtered.map((ex) => {
              const selected = selectedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex.id)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left',
                    selected
                      ? 'bg-brand-500/10 border-brand-500 text-brand-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500',
                  ].join(' ')}
                >
                  <div>
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{ex.primaryMuscles.join(', ')}</p>
                  </div>
                  {selected && <Check size={16} className="text-brand-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
              Selected ({selectedIds.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const ex = exercises.find((e) => e.id === id);
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-sm"
                  >
                    {ex?.name ?? id}
                    <button
                      onClick={() => toggle(id)}
                      className="hover:text-white"
                      aria-label={`Remove ${ex?.name ?? id}`}
                      title={`Remove ${ex?.name ?? id}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Save as template toggle */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setSaveAsTemplate((p) => !p)}
                className={[
                  'flex items-center gap-2 text-sm transition-colors',
                  saveAsTemplate ? 'text-brand-400' : 'text-slate-400',
                ].join(' ')}
              >
                <Save size={14} />
                Save as template
              </button>
            </div>

            {saveAsTemplate && (
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name…"
                className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            )}
          </section>
        )}
      </div>

      {/* Start button */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 px-4">
        <Button
          onClick={handleStart}
          disabled={selectedIds.length === 0}
          className="w-full flex items-center justify-center gap-2"
        >
            <Zap size={16} />
            {selectedIds.length > 0
              ? `${getTrainingPrimaryActionLabel('start_workout')} (${selectedIds.length} exercises)`
              : 'Select at least 1 exercise to start'}
          </Button>
      </div>
    </AppShell>
  );
}
