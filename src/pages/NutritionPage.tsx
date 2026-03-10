import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { NutritionLog, NutritionGoals, MealPlan, Meal } from '../types';
import { calculateStreak } from '../utils/dateUtils';
import { getMealPlan } from '../services/claudeService';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { today as todayStr } from '../utils/dateUtils';
import { getExperienceMode } from '../utils/localStorage';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Beef,
  Wheat,
  Droplets,
  Settings2,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Default goals by fitness goal ────────────────────────────────────────────

const GOAL_DEFAULTS: Record<string, NutritionGoals> = {
  hypertrophy:      { calories: 3000, proteinG: 220, carbsG: 320, fatG: 80 },
  'fat-loss':       { calories: 2000, proteinG: 180, carbsG: 160, fatG: 65 },
  'general-fitness':{ calories: 2400, proteinG: 160, carbsG: 270, fatG: 70 },
};

type GuidedPlanType = 'weight-loss' | 'weight-gain' | 'maintenance';

const PLAN_TEMPLATE_COPY: Record<GuidedPlanType, { title: string; summary: string; bullets: string[] }> = {
  'weight-loss': {
    title: 'Weight Loss Plan',
    summary: 'A sustainable calorie deficit with high protein and consistent meal timing.',
    bullets: [
      'Calorie deficit guidance with realistic pacing',
      'Protein-first meals to support recovery and satiety',
      'Simple meal structure plus hydration reminders',
    ],
  },
  'weight-gain': {
    title: 'Weight Gain Plan',
    summary: 'A lean surplus strategy focused on muscle recovery and consistent intake.',
    bullets: [
      'Calorie surplus guidance without extreme jumps',
      'Protein targets for muscle growth support',
      'Meal frequency and recovery-focused nutrition tips',
    ],
  },
  maintenance: {
    title: 'Maintenance Plan',
    summary: 'Balanced calorie intake with habits that are easy to sustain long-term.',
    bullets: [
      'Balanced macro guidance for consistency',
      'Simple weekly habits to stay on track',
      'Hydration and meal rhythm for energy and recovery',
    ],
  },
};

const LS_GOALS_KEY = 'omnexus_nutrition_goals';

function loadGoals(userGoal: string): NutritionGoals {
  try {
    const raw = localStorage.getItem(LS_GOALS_KEY);
    if (raw) return JSON.parse(raw) as NutritionGoals;
  } catch { /* ignore */ }
  return GOAL_DEFAULTS[userGoal] ?? GOAL_DEFAULTS['general-fitness'];
}

function saveGoals(goals: NutritionGoals) {
  localStorage.setItem(LS_GOALS_KEY, JSON.stringify(goals));
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const t = todayStr();
  if (dateStr === t) return 'Today';
  if (dateStr === shiftDate(t, -1)) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

async function loadNutritionData(userId: string, date: string) {
  const db = await import('../lib/db');
  const sevenDaysAgo = shiftDate(todayStr(), -7);
  const sixtyDaysAgo = shiftDate(todayStr(), -60);

  return Promise.all([
    db.fetchNutritionLogs(userId, date),
    db.fetchRecentNutritionLogs(userId, sevenDaysAgo),
    db.fetchNutritionLogDates(userId, sixtyDaysAgo),
  ]);
}

async function addNutritionLogToDb(log: {
  userId: string;
  loggedAt: string;
  mealName?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}) {
  const db = await import('../lib/db');
  return db.addNutritionLog(log);
}

async function deleteNutritionLogFromDb(id: string, userId: string) {
  const db = await import('../lib/db');
  return db.deleteNutritionLog(id, userId);
}

// ─── Calorie ring ─────────────────────────────────────────────────────────────

const CAL_RADIUS = 38;
const CAL_CIRCUMFERENCE = 2 * Math.PI * CAL_RADIUS; // ≈ 238.76

// ─── Calorie ring (centres label inside SVG) ─────────────────────────────────

interface CalorieSectionProps {
  current: number;
  goal: number;
}

function CalorieSection({ current, goal }: CalorieSectionProps) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const over = current > goal;
  const offset = CAL_CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90" aria-hidden>
          <circle cx={48} cy={48} r={CAL_RADIUS} fill="none" stroke="rgba(100,116,139,0.25)" strokeWidth={8} />
          <circle
            cx={48} cy={48} r={CAL_RADIUS} fill="none"
            stroke={over ? '#f87171' : 'var(--color-brand-500, #7c3aed)'}
            strokeWidth={8} strokeLinecap="round"
            strokeDasharray={CAL_CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Overlaid text centred in the SVG */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-bold tabular-nums leading-none ${over ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {Math.round(current)}
          </span>
          <span className="text-[9px] text-slate-400 leading-none mt-0.5">cal</span>
        </div>
      </div>
      <div className="flex flex-col items-center mt-1">
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          <span className={`font-semibold ${over ? 'text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {Math.abs(goal - current).toFixed(0)}
          </span>
          {' '}kcal {over ? 'over' : 'left'}
        </span>
      </div>
    </div>
  );
}

// ─── Macro bar ────────────────────────────────────────────────────────────────

interface MacroBarProps {
  icon: React.ReactNode;
  label: string;
  unit: string;
  current: number;
  goal: number;
  fillColor: string;
}

function MacroBar({ icon, label, unit, current, goal, fillColor }: MacroBarProps) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const over = current > goal;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`text-xs font-semibold tabular-nums ${over ? 'text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {Math.round(current)}<span className="font-normal text-slate-400">/{goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <svg className="h-full w-full" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
          <rect x="0" y="0" width="100" height="8" fill="transparent" />
          <rect
            x="0"
            y="0"
            width={pct}
            height="8"
            fill={over ? '#f87171' : fillColor}
            className="transition-all duration-500"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NutritionPage() {
  const { state } = useApp();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const user = state.user;
  const isGuest = !!user?.isGuest;
  const isGuidedMode = user ? getExperienceMode(user.id) === 'guided' : true;

  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<NutritionGoals>(() =>
    loadGoals(user?.goal ?? 'general-fitness'),
  );
  const [showGoals, setShowGoals] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add form state
  const [form, setForm] = useState({
    mealName: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });
  const [adding, setAdding] = useState(false);

  // Meal plan state
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [mealPlanPrefs, setMealPlanPrefs] = useState('');
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [mealPlanError, setMealPlanError] = useState('');
  const [expandedMealIdx, setExpandedMealIdx] = useState<number | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<GuidedPlanType>(
    user?.goal === 'fat-loss' ? 'weight-loss' : user?.goal === 'hypertrophy' ? 'weight-gain' : 'maintenance',
  );

  // Quick-add and streak state
  const [recentMeals, setRecentMeals] = useState<NutritionLog[]>([]);
  const [nutritionStreak, setNutritionStreak] = useState(0);

  // Goal edit state
  const [goalDraft, setGoalDraft] = useState(goals);

  const load = useCallback(async () => {
    if (!user || isGuest || !session) return;
    setLoading(true);
    try {
      const [logs, recentLogs, logDates] = await loadNutritionData(user.id, date);
      setEntries(logs);

      // Derive quick-add meals: distinct named entries with at least one macro, most recent first, cap 4
      const seen = new Set<string>();
      const quick: NutritionLog[] = [];
      for (const m of recentLogs) {
        if (!m.mealName || seen.has(m.mealName)) continue;
        if (!m.calories && !m.proteinG && !m.carbsG && !m.fatG) continue;
        seen.add(m.mealName);
        quick.push(m);
        if (quick.length === 4) break;
      }
      setRecentMeals(quick);

      setNutritionStreak(calculateStreak(logDates));
    } finally {
      setLoading(false);
    }
  }, [user, date, session, isGuest]);

  useEffect(() => { load(); }, [load]);

  // Totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      proteinG: acc.proteinG + (e.proteinG ?? 0),
      carbsG: acc.carbsG + (e.carbsG ?? 0),
      fatG: acc.fatG + (e.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  async function quickLog(meal: NutritionLog) {
    if (!user || isGuest || !session) return;
    try {
      const log = await addNutritionLogToDb({
        userId: user.id,
        loggedAt: date,
        mealName: meal.mealName,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
      });
      if (log) {
        setEntries((prev) => [...prev, log]);
        toast(`${meal.mealName ?? 'Meal'} logged`, 'success');
      }
    } catch {
      toast('Failed to log meal', 'error');
    }
  }

  async function handleAdd() {
    if (!user || isGuest || !session) return;
    const cal = parseFloat(form.calories) || undefined;
    const pro = parseFloat(form.proteinG) || undefined;
    const car = parseFloat(form.carbsG) || undefined;
    const fat = parseFloat(form.fatG) || undefined;
    if (!form.mealName.trim() && !cal && !pro && !car && !fat) return;

    setAdding(true);
    try {
      const log = await addNutritionLogToDb({
        userId: user.id,
        loggedAt: date,
        mealName: form.mealName.trim() || undefined,
        calories: cal,
        proteinG: pro,
        carbsG: car,
        fatG: fat,
      });
      if (log) {
        setEntries((prev) => [...prev, log]);
        toast('Meal logged', 'success');
      }
      setForm({ mealName: '', calories: '', proteinG: '', carbsG: '', fatG: '' });
      setShowAddModal(false);
    } catch {
      toast('Failed to log meal', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user?.id) return;
    try {
      await deleteNutritionLogFromDb(id, user.id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast('Entry removed', 'success');
    } catch {
      toast('Failed to delete entry', 'error');
    }
  }

  async function handleGenerateMealPlan() {
    setGeneratingMealPlan(true);
    setMealPlanError('');
    setGeneratedPlan(null);
    try {
      const res = await getMealPlan({
        calories: goals.calories,
        proteinG: goals.proteinG,
        carbsG: goals.carbsG,
        fatG: goals.fatG,
        planType: selectedPlanType,
        preferences: mealPlanPrefs.trim() || undefined,
      });
      setGeneratedPlan(res.plan);
    } catch (e) {
      setMealPlanError(e instanceof Error ? e.message : 'Failed to generate meal plan');
    } finally {
      setGeneratingMealPlan(false);
    }
  }

  async function handleLogMeal(meal: Meal) {
    if (!user || isGuest || !session) return;
    try {
      const log = await addNutritionLogToDb({
        userId: user.id,
        loggedAt: date,
        mealName: `${meal.mealTime}: ${meal.name}`,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
      });
      if (log) {
        setEntries((prev) => [...prev, log]);
        toast(`${meal.name} logged`, 'success');
      }
    } catch {
      toast('Failed to log meal', 'error');
    }
  }

  function handleSaveGoals() {
    setGoals(goalDraft);
    saveGoals(goalDraft);
    setShowGoals(false);
  }

  if (isGuest) {
    return (
      <AppShell>
        <TopBar title="Nutrition" showBack />
        <div className="flex flex-col items-center justify-center px-6 text-center gap-4 py-24">
          <span className="text-5xl">🥗</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Nutrition is available with a free account
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
            Create one to log meals, track macros, and keep your nutrition progress alongside your workouts.
          </p>
          <Button onClick={() => navigate('/onboarding')} size="lg">
            Create Free Account
          </Button>
        </div>
      </AppShell>
    );
  }

  const isToday = date === todayStr();

  return (
    <AppShell>
      <TopBar title="Nutrition" showBack />

      <div className="px-4 pb-6 space-y-4 mt-2">
        {/* Date navigator */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setDate((d) => shiftDate(d, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatDisplayDate(date)}
          </p>
          <button
            onClick={() => setDate((d) => shiftDate(d, 1))}
            disabled={isToday}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Macro summary */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Daily Macros
              </p>
              {nutritionStreak > 0 && (
                <span className="text-xs font-semibold text-brand-400">
                  {nutritionStreak >= 3 ? '🔥' : '⚡'} {nutritionStreak}d
                </span>
              )}
            </div>
            <button
              onClick={() => { setGoalDraft(goals); setShowGoals(true); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Settings2 size={13} />
              Goals
            </button>
          </div>

          {/* Calories ring + macro bars side-by-side */}
          <div className="flex items-center gap-4">
            <CalorieSection current={totals.calories} goal={goals.calories} />
            <div className="flex-1 space-y-2.5">
              <MacroBar
                icon={<Beef size={12} className="text-red-400" />}
                label="Protein"
                unit="g"
                current={totals.proteinG}
                goal={goals.proteinG}
                fillColor="#f87171"
              />
              <MacroBar
                icon={<Wheat size={12} className="text-amber-400" />}
                label="Carbs"
                unit="g"
                current={totals.carbsG}
                goal={goals.carbsG}
                fillColor="#fbbf24"
              />
              <MacroBar
                icon={<Droplets size={12} className="text-blue-400" />}
                label="Fat"
                unit="g"
                current={totals.fatG}
                goal={goals.fatG}
                fillColor="#60a5fa"
              />
            </div>
          </div>
        </Card>

        {isGuidedMode && (
          <TermHelpChips
            title="Nutrition terms explained"
            terms={[
              {
                key: 'calories',
                label: 'Calories',
                description: 'Your daily energy intake from food and drinks.',
              },
              {
                key: 'macros',
                label: 'Macros',
                description: 'Protein, carbs, and fat. These shape recovery, energy, and body-composition goals.',
              },
              {
                key: 'protein',
                label: 'Protein target',
                description: 'Daily protein goal to support muscle recovery and appetite control.',
              },
            ]}
          />
        )}

        {/* Quick-add recent meals */}
        {recentMeals.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Quick-add recent</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {recentMeals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => quickLog(m)}
                  className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-200 hover:border-brand-500 hover:bg-brand-500/10 transition-colors whitespace-nowrap"
                >
                  {m.mealName} · {m.calories ?? '?'} kcal
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add entry button */}
        <div className="flex gap-2">
          <Button fullWidth onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Log Food
          </Button>
          <Button variant="secondary" onClick={() => { setShowMealPlanModal(true); setGeneratedPlan(null); setMealPlanError(''); }}>
            <Wand2 size={16} />
            Meal Plan
          </Button>
        </div>

        {/* Entries list */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">🥗</span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No meals logged for {formatDisplayDate(date).toLowerCase()}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Log food to track calories and macros for the day.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm">
              New to nutrition tracking? Start with one meal and one protein target today. Consistency beats perfection.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {entry.mealName || 'Entry'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {entry.calories != null && (
                      <span className="text-xs text-orange-500 tabular-nums">{entry.calories} kcal</span>
                    )}
                    {entry.proteinG != null && (
                      <span className="text-xs text-red-400 tabular-nums">{entry.proteinG}g protein</span>
                    )}
                    {entry.carbsG != null && (
                      <span className="text-xs text-amber-500 tabular-nums">{entry.carbsG}g carbs</span>
                    )}
                    {entry.fatG != null && (
                      <span className="text-xs text-blue-400 tabular-nums">{entry.fatG}g fat</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 text-slate-300 hover:text-red-400 dark:hover:text-red-400 transition-colors p-1"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add Food Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log Food"
      >
        <div className="space-y-3">
          <Input
            label="Meal / Food name"
            value={form.mealName}
            onChange={(e) => setForm((f) => ({ ...f, mealName: e.target.value }))}
            placeholder="e.g. Chicken & rice, Breakfast…"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories (kcal)"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.calories}
              onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Protein (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.proteinG}
              onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Carbs (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.carbsG}
              onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Fat (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.fatG}
              onChange={(e) => setForm((f) => ({ ...f, fatG: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} fullWidth>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={adding} fullWidth>
              {adding ? 'Saving…' : 'Add Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Meal Plan Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={showMealPlanModal}
        onClose={() => setShowMealPlanModal(false)}
        title="AI Meal Plan"
      >
        {!generatedPlan ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Generate a one-day meal plan matching your macro goals ({goals.calories} kcal, {goals.proteinG}g protein).
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Beginner tip: choose a plan style first, then keep food preferences simple. You can refine later.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Choose a guided plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['weight-loss', 'weight-gain', 'maintenance'] as GuidedPlanType[]).map((type) => {
                  const active = selectedPlanType === type;
                  const copy = PLAN_TEMPLATE_COPY[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedPlanType(type)}
                      className={[
                        'rounded-xl border px-3 py-2 text-left transition-colors',
                        active
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-brand-400/70',
                      ].join(' ')}
                    >
                      <p className="text-xs font-semibold text-slate-100">{copy.title}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{copy.summary}</p>
                    </button>
                  );
                })}
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 pl-1">
                {PLAN_TEMPLATE_COPY[selectedPlanType].bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Advanced preferences (optional)</p>
            <textarea
              value={mealPlanPrefs}
              onChange={(e) => setMealPlanPrefs(e.target.value)}
              placeholder="Examples: vegetarian, no gluten, low dairy, quick meals, budget-friendly"
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {mealPlanError && <p className="text-red-400 text-xs">{mealPlanError}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowMealPlanModal(false)} fullWidth>Cancel</Button>
              <Button onClick={handleGenerateMealPlan} disabled={generatingMealPlan} fullWidth>
                {generatingMealPlan ? 'Generating…' : 'Generate Plan'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {generatedPlan.overview && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2.5">
                <p className="text-xs text-slate-300">{generatedPlan.overview}</p>
              </div>
            )}
            {generatedPlan.dailyTips && generatedPlan.dailyTips.length > 0 && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300 mb-1">Beginner Coaching Tips</p>
                <div className="space-y-1">
                  {generatedPlan.dailyTips.slice(0, 4).map((tip) => (
                    <p key={tip} className="text-xs text-slate-200">- {tip}</p>
                  ))}
                </div>
                {generatedPlan.hydrationReminder && (
                  <p className="text-xs text-blue-300 mt-2">{generatedPlan.hydrationReminder}</p>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400">
              Tap "Log This" to add a meal to today's diary.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedPlan.meals.map((meal, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-left"
                    onClick={() => setExpandedMealIdx(expandedMealIdx === i ? null : i)}
                  >
                    <div>
                      <span className="text-xs text-brand-400 font-medium">{meal.mealTime}</span>
                      <p className="text-sm font-semibold text-slate-200">{meal.name}</p>
                      <p className="text-xs text-slate-400">{meal.calories} kcal · {meal.proteinG}g P</p>
                    </div>
                    {expandedMealIdx === i ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>
                  {expandedMealIdx === i && (
                    <div className="px-3 py-2 bg-white dark:bg-slate-900 space-y-1.5">
                      <p className="text-xs text-slate-400">{meal.description}</p>
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-400">{meal.carbsG}g carbs</span>
                        <span className="text-blue-400">{meal.fatG}g fat</span>
                      </div>
                      <Button size="sm" onClick={() => handleLogMeal(meal)} className="w-full mt-1">
                        Log This
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 text-xs text-slate-400 flex justify-between">
              <span>Total</span>
              <span>{generatedPlan.totalCalories} kcal · {generatedPlan.totalProtein}g protein</span>
            </div>
            <Button variant="ghost" onClick={() => setGeneratedPlan(null)} fullWidth>
              Regenerate
            </Button>
          </div>
        )}
      </Modal>

      {/* ─── Goals Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={showGoals}
        onClose={() => setShowGoals(false)}
        title="Daily Goals"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Set your daily nutrition targets. Defaults are based on your fitness goal.
          </p>
          <Input
            label="Calories (kcal)"
            type="number"
            inputMode="numeric"
            min={500}
            value={String(goalDraft.calories)}
            onChange={(e) =>
              setGoalDraft((g) => ({ ...g, calories: parseInt(e.target.value) || 0 }))
            }
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Protein (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={String(goalDraft.proteinG)}
              onChange={(e) =>
                setGoalDraft((g) => ({ ...g, proteinG: parseFloat(e.target.value) || 0 }))
              }
            />
            <Input
              label="Carbs (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={String(goalDraft.carbsG)}
              onChange={(e) =>
                setGoalDraft((g) => ({ ...g, carbsG: parseFloat(e.target.value) || 0 }))
              }
            />
            <Input
              label="Fat (g)"
              type="number"
              inputMode="decimal"
              min={0}
              value={String(goalDraft.fatG)}
              onChange={(e) =>
                setGoalDraft((g) => ({ ...g, fatG: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => {
                const defaults = GOAL_DEFAULTS[user?.goal ?? 'general-fitness'];
                setGoalDraft(defaults);
              }}
              fullWidth
            >
              Reset to defaults
            </Button>
            <Button onClick={handleSaveGoals} fullWidth>
              Save Goals
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
