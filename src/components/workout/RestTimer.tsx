import { X } from 'lucide-react';
import { formatDuration } from '../../utils/dateUtils';

interface RestTimerProps {
  seconds: number;
  isRunning: boolean;
  onStop: () => void;
}

export function RestTimer({ seconds, isRunning, onStop }: RestTimerProps) {
  if (!isRunning) return null;

  const pct = seconds > 0 ? ((180 - seconds) / 180) * 100 : 100;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Rest Timer</p>
          <button
            onClick={onStop}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Skip rest"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatDuration(seconds)}
          </span>
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
