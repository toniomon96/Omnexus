import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MuscleGroup, Equipment, MovementPattern, ExperienceLevel } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { SearchBar } from '../components/exercise-library/SearchBar';
import { MuscleGroupFilter } from '../components/exercise-library/MuscleGroupFilter';
import { MovementPatternGrid } from '../components/exercise-library/MovementPatternGrid';
import { DifficultyFilter } from '../components/exercise-library/DifficultyFilter';
import { ExerciseCard } from '../components/exercise-library/ExerciseCard';
import { EmptyState } from '../components/ui/EmptyState';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { filterExercises } from '../lib/exerciseSearch';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Grid3X3, Dumbbell, Layers, Star, BookOpen, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscoveryMode = 'search' | 'pattern' | 'muscle' | 'equipment' | 'difficulty';

interface LocationState {
  filterPattern?: MovementPattern;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Array<{
  id: DiscoveryMode;
  label: string;
  Icon: React.FC<{ size: number; className?: string }>;
}> = [
  { id: 'search',     label: 'Search',    Icon: Search },
  { id: 'pattern',    label: 'Pattern',   Icon: Grid3X3 },
  { id: 'muscle',     label: 'Muscle',    Icon: Layers },
  { id: 'equipment',  label: 'Equipment', Icon: Dumbbell },
  { id: 'difficulty', label: 'Level',     Icon: Star },
];

const EQUIPMENT_OPTIONS: Array<{ value: Equipment | 'all'; label: string; emoji: string }> = [
  { value: 'all',                label: 'All',        emoji: '🌐' },
  { value: 'bodyweight',         label: 'Bodyweight', emoji: '🧍' },
  { value: 'dumbbell',           label: 'Dumbbells',  emoji: '🏋️' },
  { value: 'barbell',            label: 'Barbell',    emoji: '🏋️' },
  { value: 'cable',              label: 'Cable',      emoji: '🔗' },
  { value: 'machine',            label: 'Machine',    emoji: '⚙️' },
  { value: 'kettlebell',         label: 'Kettlebell', emoji: '🔔' },
  { value: 'resistance-band',    label: 'Bands',      emoji: '🪢' },
  { value: 'ez-bar',             label: 'EZ Bar',     emoji: '〽️' },
  { value: 'suspension-trainer', label: 'TRX',        emoji: '🔄' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // Read navigation state once at mount to support "filter by pattern" deep-link
  const initialState = location.state as LocationState | null;

  const [mode, setMode] = useState<DiscoveryMode>(initialState?.filterPattern ? 'pattern' : 'search');
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState<MovementPattern | null>(initialState?.filterPattern ?? null);
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | 'all' | 'my-gym'>('all');
  const [difficulty, setDifficulty] = useState<ExperienceLevel | null>(null);
  const [myGymEquipment, setMyGymEquipment] = useState<Equipment[]>([]);

  // ── Natural language (semantic) search state ────────────────────────────────
  const [nlIds, setNlIds] = useState<string[] | null>(null);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlActive, setNlActive] = useState(false);
  const nlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch training profile to power "My Gym" equipment filter ──────────────
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    (async () => {
      try {
        const { fetchTrainingProfile } = await import('../lib/db');
        const profile = await fetchTrainingProfile(userId);
        if (profile?.equipment?.length) {
          setMyGymEquipment(profile.equipment as Equipment[]);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('[ExerciseLibrary] Failed to fetch training profile:', error);
      }
    })();
  }, [session?.user?.id]);

  // ── Natural language search — debounce and call /api/exercise-search ─────────
  const runNLSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setNlIds(null);
      setNlActive(false);
      return;
    }
    setNlLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
      const res = await fetch(`${apiBase}/api/exercise-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('search error');
      const json = await res.json() as { ids: string[]; degraded?: boolean };
      if (!json.degraded && json.ids.length > 0) {
        setNlIds(json.ids);
        setNlActive(true);
      } else {
        setNlIds(null);
        setNlActive(false);
      }
    } catch {
      // Graceful fallback — local keyword search takes over
      setNlIds(null);
      setNlActive(false);
    } finally {
      setNlLoading(false);
    }
  }, []);

  // Detect natural language queries: two or more words (handles "upper back with no barbell")
  const isNLQuery = mode === 'search' && query.trim().split(/\s+/).length >= 2;

  useEffect(() => {
    if (!isNLQuery) {
      if (nlDebounceRef.current) clearTimeout(nlDebounceRef.current);
      setNlIds(null);
      setNlActive(false);
      setNlLoading(false);
      return;
    }
    if (nlDebounceRef.current) clearTimeout(nlDebounceRef.current);
    nlDebounceRef.current = setTimeout(() => { void runNLSearch(query); }, 500);
    return () => { if (nlDebounceRef.current) clearTimeout(nlDebounceRef.current); };
  }, [query, isNLQuery]);

  // ── Filtered exercise list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    // When NL semantic search has results, return exercises ranked by AI order
    if (mode === 'search' && nlActive && nlIds && nlIds.length > 0) {
      const byId = new Map(EXERCISE_LIBRARY.map((ex) => [ex.id, ex]));
      return nlIds.flatMap((id) => {
        const ex = byId.get(id);
        return ex ? [ex] : [];
      });
    }

    // For "my-gym" mode: pre-filter by user's equipment list then apply other params
    const base =
      mode === 'equipment' && equipment === 'my-gym' && myGymEquipment.length > 0
        ? EXERCISE_LIBRARY.filter((ex) =>
            ex.equipment.some((e) => myGymEquipment.includes(e)),
          )
        : EXERCISE_LIBRARY;

    return filterExercises(base, {
      query:      mode === 'search'     ? query     : '',
      pattern:    mode === 'pattern'    ? pattern   : null,
      muscle:     mode === 'muscle'     ? muscle    : null,
      equipment:
        mode === 'equipment' && equipment !== 'my-gym'
          ? (equipment as Equipment | 'all')
          : 'all',
      difficulty: mode === 'difficulty' ? difficulty : null,
    });
  }, [mode, query, pattern, muscle, equipment, difficulty, myGymEquipment, nlActive, nlIds]);


  // ── Active filter helpers ──────────────────────────────────────────────────
  const hasActiveFilter =
    (mode === 'search'     && query.trim().length > 0) ||
    (mode === 'pattern'    && pattern !== null) ||
    (mode === 'muscle'     && muscle !== null) ||
    (mode === 'equipment'  && equipment !== 'all') ||
    (mode === 'difficulty' && difficulty !== null);

  function clearCurrentFilter() {
    setQuery('');
    setPattern(null);
    setMuscle(null);
    setEquipment('all');
    setDifficulty(null);
    setNlIds(null);
    setNlActive(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <TopBar title="Exercise Library" />

      {/* ── Discovery mode tab bar ── */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(({ id, label, Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={[
                'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                active
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              <Icon size={13} className={active ? 'text-white' : ''} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-6 mt-3 space-y-4">

        {/* ── Mode-specific filter UI ── */}
        {mode === 'search' && (
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search exercises, muscles, or patterns…"
            loading={nlLoading}
            semanticActive={nlActive}
          />
        )}

        {mode === 'pattern' && (
          <MovementPatternGrid selected={pattern} onChange={setPattern} />
        )}

        {mode === 'muscle' && (
          <MuscleGroupFilter selected={muscle} onChange={setMuscle} />
        )}

        {mode === 'equipment' && (
          <div className="space-y-2">
            {myGymEquipment.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEquipment(equipment === 'my-gym' ? 'all' : 'my-gym')}
                  className={[
                    'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                    equipment === 'my-gym'
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700 hover:bg-brand-100',
                  ].join(' ')}
                >
                  🏠 My Gym
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {myGymEquipment.length} equipment type{myGymEquipment.length !== 1 ? 's' : ''} from your profile
                </p>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEquipment(opt.value)}
                  className={[
                    'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    equipment === opt.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                  ].join(' ')}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'difficulty' && (
          <DifficultyFilter selected={difficulty} onChange={setDifficulty} />
        )}

        {/* ── Result count + clear ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearCurrentFilter}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* ── Exercise list ── */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onQuickAdd={(id) => navigate('/workout/quick', { state: { preselectedExerciseId: id } })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen size={40} />}
            title={hasActiveFilter ? 'No exercises found' : 'Browse exercises'}
            description={
              hasActiveFilter
                ? mode === 'search'
                  ? 'No matches for your search. Try a different term or switch discovery mode.'
                  : 'No exercises match your selection. Try a different option or clear the filter.'
                : mode === 'pattern'
                  ? 'Select a movement pattern above to browse exercises.'
                  : mode === 'muscle'
                    ? 'Select a muscle group above to browse exercises.'
                    : mode === 'equipment'
                      ? 'Select equipment above to browse exercises.'
                      : mode === 'difficulty'
                        ? 'Select a difficulty level above to browse exercises.'
                        : 'Type in the search box above to find exercises.'
            }
            action={
              hasActiveFilter ? (
                <button
                  type="button"
                  onClick={clearCurrentFilter}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500"
                >
                  Clear filter
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </AppShell>
  );
}
