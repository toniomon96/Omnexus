import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { exercises as exerciseList } from '../data/exercises';
import { saveCustomProgram } from '../utils/localStorage';
import { useApp } from '../store/AppContext';
import type {
  Goal,
  ExperienceLevel,
  DayType,
  Program,
  TrainingDay,
  ProgramExercise,
} from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Check } from 'lucide-react';

async function syncCustomProgram(program: Program, userId: string) {
  const { upsertCustomProgram } = await import('../lib/db');
  return upsertCustomProgram(program, userId);
}

// ─── Step 1 — Program meta ────────────────────────────────────────────────────

interface MetaStep {
  name: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
  estimatedDurationWeeks: number;
  description: string;
}

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'hypertrophy', label: 'Gain Muscle' },
  { value: 'fat-loss', label: 'Lose Weight' },
  { value: 'general-fitness', label: 'General Fitness' },
];

const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: 'full-body', label: 'Full Body' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'rest', label: 'Rest' },
];

// ─── Exercise picker ──────────────────────────────────────────────────────────

function ExercisePicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = exerciseList.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.primaryMuscles.some((m) => m.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-100 dark:border-slate-700 p-1">
        {filtered.slice(0, 30).map((ex) => {
          const selected = selectedIds.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => onToggle(ex.id)}
              className={[
                'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors',
                selected
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
              ].join(' ')}
            >
              <span>
                {ex.name}
                <span className="ml-1.5 text-xs text-slate-400 capitalize">
                  {ex.primaryMuscles.slice(0, 2).join(', ')}
                </span>
              </span>
              {selected && <Check size={14} className="text-brand-500 shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">No exercises found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Day builder ──────────────────────────────────────────────────────────────

interface DayBuilderProps {
  day: TrainingDay & { _id: string };
  index: number;
  onUpdate: (day: TrainingDay & { _id: string }) => void;
  onRemove: () => void;
}

function DayBuilder({ day, index, onUpdate, onRemove }: DayBuilderProps) {
  const [expanded, setExpanded] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  function toggleExercise(exerciseId: string) {
    const exists = day.exercises.find((e) => e.exerciseId === exerciseId);
    if (exists) {
      onUpdate({ ...day, exercises: day.exercises.filter((e) => e.exerciseId !== exerciseId) });
    } else {
      const newEx: ProgramExercise = {
        exerciseId,
        scheme: { sets: 3, reps: '8-12', restSeconds: 90 },
      };
      onUpdate({ ...day, exercises: [...day.exercises, newEx] });
    }
  }

  function updateScheme(exerciseId: string, field: 'sets' | 'reps' | 'restSeconds', value: string | number) {
    onUpdate({
      ...day,
      exercises: day.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, scheme: { ...e.scheme, [field]: value } }
          : e,
      ),
    });
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="font-semibold text-sm text-slate-800 dark:text-white">
          Day {index + 1}: {day.label || '(Unnamed)'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            aria-label="Remove day"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-3">
          {/* Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day name</label>
              <input
                type="text"
                value={day.label}
                onChange={(e) => onUpdate({ ...day, label: e.target.value })}
                placeholder="e.g. Push A"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day type</label>
              <select
                value={day.type}
                onChange={(e) => onUpdate({ ...day, type: e.target.value as DayType })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {DAY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercise list */}
          {day.exercises.length > 0 && (
            <div className="space-y-2">
              {day.exercises.map((ex) => {
                const exDef = exerciseList.find((e) => e.id === ex.exerciseId);
                return (
                  <div
                    key={ex.exerciseId}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {exDef?.name ?? ex.exerciseId}
                      </span>
                      <button
                        onClick={() => toggleExercise(ex.exerciseId)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Remove exercise"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-0.5">Sets</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={ex.scheme.sets}
                          onChange={(e) => updateScheme(ex.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5">Reps</label>
                        <input
                          type="text"
                          value={ex.scheme.reps}
                          onChange={(e) => updateScheme(ex.exerciseId, 'reps', e.target.value)}
                          placeholder="8-12"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-0.5">Rest (s)</label>
                        <input
                          type="number"
                          min={0}
                          step={15}
                          value={ex.scheme.restSeconds}
                          onChange={(e) => updateScheme(ex.exerciseId, 'restSeconds', parseInt(e.target.value) || 60)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add exercises */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-brand-500 font-medium"
          >
            <Plus size={14} />
            {showPicker ? 'Close picker' : 'Add exercises'}
          </button>
          {showPicker && (
            <ExercisePicker
              selectedIds={day.exercises.map((e) => e.exerciseId)}
              onToggle={toggleExercise}
            />
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProgramBuilderPage() {
  const navigate = useNavigate();
  const { state } = useApp();

  const [meta, setMeta] = useState<MetaStep>({
    name: '',
    goal: 'hypertrophy',
    experienceLevel: 'intermediate',
    daysPerWeek: 3,
    estimatedDurationWeeks: 8,
    description: '',
  });

  const [days, setDays] = useState<Array<TrainingDay & { _id: string }>>([
    { _id: uuid(), label: 'Day 1', type: 'full-body', exercises: [] },
  ]);

  const [error, setError] = useState('');

  function addDay() {
    setDays((prev) => [
      ...prev,
      { _id: uuid(), label: `Day ${prev.length + 1}`, type: 'full-body', exercises: [] },
    ]);
  }

  function removeDay(id: string) {
    if (days.length === 1) return;
    setDays((prev) => prev.filter((d) => d._id !== id));
  }

  function updateDay(updated: TrainingDay & { _id: string }) {
    setDays((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
  }

  function handleSave() {
    if (!meta.name.trim()) {
      setError('Please enter a program name.');
      return;
    }
    if (days.every((d) => d.exercises.length === 0)) {
      setError('Add at least one exercise to a day.');
      return;
    }
    setError('');

    const program: Program = {
      id: uuid(),
      name: meta.name.trim(),
      goal: meta.goal,
      experienceLevel: meta.experienceLevel,
      description: meta.description.trim() || `Custom ${meta.daysPerWeek}-day program`,
      daysPerWeek: meta.daysPerWeek,
      estimatedDurationWeeks: meta.estimatedDurationWeeks,
      schedule: days.map(({ _id: _unused, ...day }) => day),
      tags: ['custom'],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    saveCustomProgram(program);
    // Sync to Supabase (fire-and-forget)
    if (state.user) {
      syncCustomProgram(program, state.user.id).catch((err) =>
        console.error('[ProgramBuilder] Supabase sync failed:', err),
      );
    }
    navigate('/programs');
  }

  return (
    <AppShell>
      <TopBar title="Build a Program" showBack />
      <div className="px-4 pb-8 mt-2 space-y-5">

        {/* Program details */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Program Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Program name *</label>
              <Input
                value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                placeholder="e.g. My PPL Program"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <Input
                value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Goal</label>
                <select
                  value={meta.goal}
                  onChange={(e) => setMeta({ ...meta, goal: e.target.value as Goal })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  {GOAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Level</label>
                <select
                  value={meta.experienceLevel}
                  onChange={(e) => setMeta({ ...meta, experienceLevel: e.target.value as ExperienceLevel })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  {LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Days per week</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={meta.daysPerWeek}
                  onChange={(e) => setMeta({ ...meta, daysPerWeek: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Duration (weeks)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={meta.estimatedDurationWeeks}
                  onChange={(e) => setMeta({ ...meta, estimatedDurationWeeks: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Days */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Training Days ({days.length})
            </h2>
            <button
              onClick={addDay}
              className="flex items-center gap-1 text-sm text-brand-500 font-medium"
            >
              <Plus size={14} />
              Add day
            </button>
          </div>

          {days.map((day, i) => (
            <DayBuilder
              key={day._id}
              day={day}
              index={i}
              onUpdate={updateDay}
              onRemove={() => removeDay(day._id)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Save */}
        <Button onClick={handleSave} fullWidth size="lg">
          Save Program
        </Button>
      </div>
    </AppShell>
  );
}
