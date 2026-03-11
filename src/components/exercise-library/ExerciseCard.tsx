import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChevronRight, Plus } from 'lucide-react';

const equipIcons: Record<string, string> = {
  barbell: '🏋️',
  dumbbell: '🏋️',
  cable: '🔗',
  machine: '⚙️',
  bodyweight: '🧍',
  kettlebell: '🔔',
  'resistance-band': '🪢',
  'cardio-machine': '🚴',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  cable: 'Cable station',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  'resistance-band': 'Resistance band',
  'cardio-machine': 'Cardio machine',
};

const PATTERN_LABELS: Record<string, string> = {
  squat: 'Squat pattern',
  hinge: 'Hip hinge',
  'push-horizontal': 'Horizontal push',
  'push-vertical': 'Vertical push',
  'pull-horizontal': 'Horizontal pull',
  'pull-vertical': 'Vertical pull',
  isolation: 'Isolation',
  carry: 'Carry',
  cardio: 'Cardio',
};

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (id: string) => void;
}

export const ExerciseCard = memo(function ExerciseCard({ exercise, onSelect }: ExerciseCardProps) {
  const navigate = useNavigate();

  function handleClick() {
    if (onSelect) {
      onSelect(exercise.id);
    } else {
      navigate(`/library/${exercise.id}`);
    }
  }

  return (
    <Card hover data-testid="exercise-card" onClick={handleClick} padding="sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-xl">
          {equipIcons[exercise.equipment[0] ?? ''] ?? '💪'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {exercise.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {PATTERN_LABELS[exercise.pattern ?? ''] ?? 'Strength exercise'} · {EQUIPMENT_LABELS[exercise.equipment[0] ?? ''] ?? 'Basic gym equipment'}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {exercise.primaryMuscles.slice(0, 2).map((m) => (
              <Badge key={m} color="brand" size="sm" >
                {m}
              </Badge>
            ))}
            {exercise.equipment.slice(0, 1).map((e) => (
              <Badge key={e} color="slate" size="sm">
                {EQUIPMENT_LABELS[e] ?? e}
              </Badge>
            ))}
          </div>
        </div>
        {onSelect && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(exercise.id);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500"
            aria-label={`Add ${exercise.name} to quick workout`}
          >
            <Plus size={12} />
            Add
          </button>
        )}
        {!onSelect && <ChevronRight size={16} className="shrink-0 text-slate-400" />}
      </div>
    </Card>
  );
});
