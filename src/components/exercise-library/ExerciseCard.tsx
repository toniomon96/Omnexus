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

function getEquipmentSummary(equipment: string[]): string {
  if (equipment.length === 0) return 'Basic gym equipment';
  const first = EQUIPMENT_LABELS[equipment[0]] ?? equipment[0];
  if (equipment.length === 1) return first;
  return `${first} +${equipment.length - 1}`;
}

function getTargetMuscleSummary(primaryMuscles: string[], secondaryMuscles: string[]): string {
  const all = [...primaryMuscles, ...secondaryMuscles].filter(Boolean);
  if (all.length === 0) return 'General strength focus';
  if (all.length === 1) return `Targets ${all[0]}`;
  return `Targets ${all[0]} and ${all[1]}`;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onQuickAdd?: (id: string) => void;
}

export const ExerciseCard = memo(function ExerciseCard({ exercise, onQuickAdd }: ExerciseCardProps) {
  const navigate = useNavigate();
  const patternLabel = PATTERN_LABELS[exercise.pattern ?? ''] ?? 'Strength exercise';
  const equipmentSummary = getEquipmentSummary(exercise.equipment);
  const targetSummary = getTargetMuscleSummary(exercise.primaryMuscles, exercise.secondaryMuscles);
  const primaryMuscles = exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles : ['full body'];

  function handleClick() {
    navigate(`/library/${exercise.id}`);
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
            {patternLabel} · {equipmentSummary}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
            {targetSummary}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {primaryMuscles.slice(0, 2).map((m) => (
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
        {onQuickAdd && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickAdd(exercise.id);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500"
            aria-label={`Add ${exercise.name} to quick workout`}
          >
            <Plus size={12} />
            Add
          </button>
        )}
        <ChevronRight size={16} className="shrink-0 text-slate-400" />
      </div>
    </Card>
  );
});
