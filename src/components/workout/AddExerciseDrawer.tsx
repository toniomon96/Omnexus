import { useState } from 'react';
import { X } from 'lucide-react';
import { exercises } from '../../data/exercises';
import { filterExercises } from '../../lib/exerciseSearch';
import { SearchBar } from '../exercise-library/SearchBar';
import { Badge } from '../ui/Badge';

interface AddExerciseDrawerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
}

export function AddExerciseDrawer({ open, onClose, onAdd }: AddExerciseDrawerProps) {
  const [query, setQuery] = useState('');

  const filtered = filterExercises(exercises, { query });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-3xl bg-white dark:bg-slate-800 shadow-xl max-h-[80dvh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Add Exercise</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        <ul className="overflow-y-auto flex-1 px-4 pb-6 space-y-2">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <button
                onClick={() => { onAdd(ex.id); onClose(); setQuery(''); }}
                className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {ex.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {(ex.pattern ?? 'strength').replace('-', ' ')} · {(ex.equipment[0] ?? 'bodyweight').replace('-', ' ')}
                </p>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {ex.primaryMuscles.slice(0, 2).map((m) => (
                    <Badge key={m} color="brand" size="sm">{m}</Badge>
                  ))}
                </div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-center py-8 text-slate-400 text-sm space-y-2">
              <p>No exercises found</p>
              {query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500"
                >
                  Clear search
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
