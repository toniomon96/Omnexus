import type { Program } from '../../types';
import { getProgramWeekCursor } from '../../utils/localStorage';
import { getNextWorkout } from '../../utils/programUtils';
import { Layers } from 'lucide-react';

interface ProgramContextBarProps {
  program: Program;
  className?: string;
}

export function ProgramContextBar({ program, className = '' }: ProgramContextBarProps) {
  const week = getProgramWeekCursor(program.id);
  const next = getNextWorkout(program);
  const totalWeeks = program.estimatedDurationWeeks ?? 8;
  const dayNumber = next.dayIndex + 1;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      <Layers size={11} className="text-brand-500 shrink-0" />
      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
        {program.name}
      </span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
        Week {week} of {totalWeeks}
      </span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
        Day {dayNumber}
      </span>
    </div>
  );
}
