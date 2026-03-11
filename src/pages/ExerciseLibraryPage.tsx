import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MuscleGroup, Equipment } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { SearchBar } from '../components/exercise-library/SearchBar';
import { MuscleGroupFilter } from '../components/exercise-library/MuscleGroupFilter';
import { ExerciseCard } from '../components/exercise-library/ExerciseCard';
import { EmptyState } from '../components/ui/EmptyState';
import { exercises } from '../data/exercises';
import { BookOpen } from 'lucide-react';

export function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all');

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesQuery =
        !query ||
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.primaryMuscles.some((m) =>
          m.toLowerCase().includes(query.toLowerCase()),
        ) ||
        ex.equipment.some((e) =>
          e.toLowerCase().includes(query.toLowerCase()),
        );
      const matchesMuscle =
        !muscle ||
        ex.primaryMuscles.includes(muscle) ||
        ex.secondaryMuscles.includes(muscle);
      const matchesEquipment = equipment === 'all' || ex.equipment.includes(equipment);
      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [query, muscle, equipment]);

  const EQUIPMENT_FILTERS: Array<{ value: Equipment | 'all'; label: string }> = [
    { value: 'all', label: 'All equipment' },
    { value: 'bodyweight', label: 'Bodyweight only' },
    { value: 'dumbbell', label: 'Dumbbells' },
    { value: 'barbell', label: 'Barbell' },
    { value: 'cable', label: 'Cable' },
    { value: 'machine', label: 'Machine' },
    { value: 'kettlebell', label: 'Kettlebell' },
    { value: 'resistance-band', label: 'Resistance band' },
  ];

  return (
    <AppShell>
      <TopBar title="Exercise Library" />
      <div className="px-4 pb-6 mt-2 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tip: Start with bodyweight or dumbbells if you are training at home.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {EQUIPMENT_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setEquipment(item.value)}
              className={[
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                equipment === item.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
        <MuscleGroupFilter selected={muscle} onChange={setMuscle} />

        <p className="text-xs text-slate-400">{filtered.length} exercises</p>

        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onSelect={(id) => navigate('/workout/quick', { state: { preselectedExerciseId: id } })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No exercises found"
            description="Try a different search term or muscle group filter."
          />
        )}
      </div>
    </AppShell>
  );
}
