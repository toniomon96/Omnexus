import type { TrainingDay, Program } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Zap } from 'lucide-react';
import { getExerciseById } from '../../data/exercises';
import { useWorkoutSession } from '../../hooks/useWorkoutSession';
import { useNavigate } from 'react-router-dom';

interface NextWorkoutCardProps {
  program: Program;
  day: TrainingDay;
  dayIndex: number;
}

export function NextWorkoutCard({ program, day, dayIndex }: NextWorkoutCardProps) {
  const { startWorkout } = useWorkoutSession();
  const navigate = useNavigate();

  function handleStart() {
    startWorkout(program, dayIndex);
    navigate('/workout/active');
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
          <Zap size={20} className="text-brand-500" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Up Next
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {day.label}
          </p>
        </div>
      </div>

      <ul className="mb-4 space-y-1.5">
        {day.exercises.slice(0, 4).map((pe) => {
          const ex = getExerciseById(pe.exerciseId);
          if (!ex) return null;
          return (
            <li
              key={pe.exerciseId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-700 dark:text-slate-300">
                {ex.name}
              </span>
              <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                {pe.scheme.sets}×{pe.scheme.reps}
              </span>
            </li>
          );
        })}
        {day.exercises.length > 4 && (
          <li className="text-sm text-slate-400">
            +{day.exercises.length - 4} more exercises
          </li>
        )}
      </ul>

      <Button onClick={handleStart} fullWidth>
        <Play size={16} />
        Start Workout
      </Button>
    </Card>
  );
}
