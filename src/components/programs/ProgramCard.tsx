import { useNavigate } from 'react-router-dom';
import type { Program } from '../../types';
import { Card } from '../ui/Card';
import { GoalBadge, LevelBadge } from '../ui/Badge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface ProgramCardProps {
  program: Program;
  isActive?: boolean;
}

export function ProgramCard({ program, isActive }: ProgramCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      hover
      data-testid="program-card"
      onClick={() => navigate(`/programs/${program.id}`)}
      className={isActive ? 'ring-2 ring-brand-500' : ''}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            <GoalBadge goal={program.goal} />
            <LevelBadge level={program.experienceLevel} />
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-900/40 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">
                Active
              </span>
            )}
            {!isActive && program.aiLifecycleStatus === 'draft' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                Draft
              </span>
            )}
            {!isActive && program.aiLifecycleStatus === 'archived' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                Archived
              </span>
            )}
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-base leading-snug">
            {program.name}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {program.description}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {program.daysPerWeek} days/wk
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {program.estimatedDurationWeeks} wks
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="shrink-0 mt-1 text-slate-400" />
      </div>
    </Card>
  );
}
