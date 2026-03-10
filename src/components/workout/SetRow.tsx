import { useEffect, useState } from 'react';
import type { LoggedSet } from '../../types';
import { Check, Trash2 } from 'lucide-react';
import { triggerHaptic } from '../../lib/capacitor';
import { parseStrictDecimal, sanitizeDecimalInput } from '../../utils/numberValidation';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatWeightValue, toStoredWeight } from '../../utils/weightUnits';

interface SetRowProps {
  set: LoggedSet;
  prevSet?: { weight: number; reps: number } | null;
  onUpdate: (data: Partial<LoggedSet>) => void;
  onRemove?: () => void;
  restSeconds: number;
  onStartRest: () => void;
}

export function SetRow({
  set,
  prevSet,
  onUpdate,
  onRemove,
  restSeconds,
  onStartRest,
}: SetRowProps) {
  const weightUnit = useWeightUnit();
  const [weightInput, setWeightInput] = useState(
    set.weight > 0 ? formatWeightValue(set.weight, weightUnit) : '',
  );
  const [repsInput, setRepsInput] = useState(set.reps > 0 ? String(set.reps) : '');

  useEffect(() => {
    setWeightInput(set.weight > 0 ? formatWeightValue(set.weight, weightUnit) : '');
  }, [set.weight, weightUnit]);

  useEffect(() => {
    setRepsInput(set.reps > 0 ? String(set.reps) : '');
  }, [set.reps]);

  function handleWeightChange(raw: string) {
    const sanitized = sanitizeDecimalInput(raw);
    setWeightInput(sanitized);

    if (!sanitized) {
      onUpdate({ weight: 0 });
      return;
    }

    const parsed = parseStrictDecimal(sanitized);
    if (parsed !== null) {
      onUpdate({ weight: toStoredWeight(parsed, weightUnit) });
    }
  }

  function handleRepsChange(raw: string) {
    const sanitized = raw.replace(/[^\d]/g, '');
    setRepsInput(sanitized);

    if (!sanitized) {
      onUpdate({ reps: 0 });
      return;
    }

    const parsed = Number.parseInt(sanitized, 10);
    if (Number.isFinite(parsed)) {
      onUpdate({ reps: parsed });
    }
  }

  function handleComplete() {
    const parsedWeight = parseStrictDecimal(weightInput);
    const hasValidWeight = parsedWeight !== null && parsedWeight >= 0;
    const hasValidReps = Number.isInteger(set.reps) && set.reps > 0;
    if (!hasValidWeight || !hasValidReps) {
      return;
    }

    triggerHaptic('light'); // tactile feedback on native; no-op on web
    const nowCompleted = !set.completed;
    onUpdate({ completed: nowCompleted });
    if (nowCompleted && restSeconds > 0) {
      onStartRest();
    }
  }

  return (
    <div
      className={[
        'rounded-xl transition-colors',
        set.completed
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-slate-50 dark:bg-slate-800/60',
      ].join(' ')}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Set number */}
        <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">
          {set.setNumber}
        </span>

        {/* Previous best */}
        <span className="w-14 shrink-0 text-center text-[10px] leading-tight text-slate-400 tabular-nums">
          {prevSet ? (
            <>
              <span className="block text-slate-300 dark:text-slate-600 text-[9px] uppercase tracking-wide">last</span>
              {formatWeightValue(prevSet.weight, weightUnit)}{weightUnit}x{prevSet.reps}
            </>
          ) : '—'}
        </span>

        {/* Weight input */}
        <div className="flex flex-1 items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={weightInput}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder={prevSet ? formatWeightValue(prevSet.weight, weightUnit) : '0'}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            aria-label={`Set ${set.setNumber} weight in ${weightUnit}`}
          />
          <span className="text-xs text-slate-400 shrink-0">{weightUnit}</span>
        </div>

        {/* Reps input */}
        <div className="flex flex-1 items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={repsInput}
            onChange={(e) => handleRepsChange(e.target.value)}
            placeholder={prevSet ? String(prevSet.reps) : '0'}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            aria-label={`Set ${set.setNumber} reps`}
          />
          <span className="text-xs text-slate-400 shrink-0">reps</span>
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
            set.completed
              ? 'bg-green-500 text-white'
              : 'border-2 border-slate-300 text-slate-300 hover:border-green-400 hover:text-green-400 dark:border-slate-600',
          ].join(' ')}
          aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
        >
          <Check size={16} strokeWidth={2.5} />
        </button>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Remove set"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* RPE tap buttons — only shown for incomplete sets */}
      {!set.completed && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <span className="text-[10px] text-slate-400 w-[72px] shrink-0">RPE (opt.)</span>
          <div className="flex gap-1">
            {[6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => onUpdate({ rpe: set.rpe === n ? undefined : n })}
                className={[
                  'w-8 h-7 rounded-lg text-xs font-medium transition-colors',
                  set.rpe === n
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600',
                ].join(' ')}
                aria-label={`RPE ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
