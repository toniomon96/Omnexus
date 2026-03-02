import { useState, useEffect } from 'react';
import { Activity, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { isNative } from '../../lib/capacitor';
import { readHealthSummary, requestHealthPermission } from '../../lib/health';
import type { HealthSummary } from '../../lib/health';
import { Card } from '../ui/Card';

const STEP_GOAL = 8000;

function formatNumber(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString();
}

function StepBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function HealthWidget() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isNative) {
      setLoading(false);
      return;
    }

    async function load() {
      const granted = await requestHealthPermission();
      if (!granted) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      const data = await readHealthSummary();
      setSummary(data);
      setLoading(false);
    }

    load();
  }, []);

  // Don't render anything on web
  if (!isNative) return null;

  if (loading) {
    return (
      <Card className="space-y-2">
        <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </Card>
    );
  }

  if (permissionDenied) {
    return (
      <Card className="flex items-center gap-3">
        <Activity size={18} className="text-slate-500 shrink-0" />
        <p className="text-xs text-slate-400">
          Health access denied. Enable it in iOS Settings → Health → Omnexus.
        </p>
      </Card>
    );
  }

  if (!summary?.isAvailable) return null;

  const stepsToday = summary.stepsToday ?? 0;
  const caloriesToday = summary.activeCaloriesToday;
  const maxDaySteps = Math.max(...summary.stepsLast7Days.map((s) => s.value), STEP_GOAL);

  return (
    <Card className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-brand-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Health Today
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={expanded ? 'Collapse health widget' : 'Expand health widget'}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatNumber(stepsToday)}
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Steps</p>
        </div>
        {caloriesToday !== null && (
          <div className="flex items-center gap-1.5 text-orange-400">
            <Flame size={14} />
            <div>
              <p className="text-sm font-semibold tabular-nums">{Math.round(caloriesToday)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cal active</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress toward step goal */}
      <div className="space-y-1">
        <StepBar value={stepsToday} max={STEP_GOAL} />
        <p className="text-[10px] text-slate-500 text-right">
          {Math.round((stepsToday / STEP_GOAL) * 100)}% of {STEP_GOAL.toLocaleString()} goal
        </p>
      </div>

      {/* 7-day mini bar chart (expanded) */}
      {expanded && summary.stepsLast7Days.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Last 7 days
          </p>
          <div className="flex items-end gap-1 h-10">
            {summary.stepsLast7Days.map((day) => {
              const pct = maxDaySteps > 0 ? (day.value / maxDaySteps) * 100 : 0;
              const label = new Date(day.startDate).toLocaleDateString(undefined, {
                weekday: 'narrow',
              });
              return (
                <div key={day.startDate} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-sm bg-brand-500/60 transition-all"
                    style={{ height: `${Math.max(2, pct)}%` }}
                  />
                  <span className="text-[8px] text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
