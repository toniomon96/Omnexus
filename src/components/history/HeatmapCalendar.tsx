import type { WorkoutSession } from '../../types';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass } from '../../utils/weightUnits';

interface HeatmapCalendarProps {
  sessions: WorkoutSession[];
  weeks?: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function volumeColor(vol: number): string {
  if (vol === 0) return 'bg-slate-200/80 dark:bg-slate-700/20';
  if (vol <= 3000) return 'bg-brand-500/25';
  if (vol <= 8000) return 'bg-brand-500/55';
  return 'bg-brand-500';
}

export function HeatmapCalendar({ sessions, weeks = 26 }: HeatmapCalendarProps) {
  const weightUnit = useWeightUnit();
  // Build volume map
  const volumeMap: Record<string, number> = {};
  for (const s of sessions) {
    const key = s.startedAt.slice(0, 10);
    volumeMap[key] = (volumeMap[key] ?? 0) + s.totalVolumeKg;
  }

  // Compute grid: weeks × 7 days, ending today
  const today = new Date();
  // Move to the most recent Sunday (end of the last column)
  const dayOfWeek = today.getDay(); // 0=Sun
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)));

  const totalDays = weeks * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  // Build 2D grid: columns = weeks, rows = days (Mon–Sun)
  const columns: Date[][] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      col.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  // Determine month label positions (first column where month changes)
  const monthLabels: { colIdx: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((col, i) => {
    const m = col[0].getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ colIdx: i, label: MONTHS[m] });
      lastMonth = m;
    }
  });

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Training Heatmap</h2>

      {/* Month labels */}
      <div className="flex mb-1 overflow-hidden" style={{ gap: 2 }}>
        {columns.map((_, i) => {
          const lbl = monthLabels.find((m) => m.colIdx === i);
          return (
            <div key={i} className="flex-shrink-0 text-[9px] text-slate-500" style={{ width: 12 }}>
              {lbl ? lbl.label : ''}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-0.5 overflow-hidden">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((d) => (
            <div key={d} className="h-3 flex items-center">
              <span className="text-[8px] text-slate-500 w-5">{d[0]}</span>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className="flex gap-0.5 overflow-x-auto flex-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-0.5 flex-shrink-0">
              {col.map((day) => {
                const iso = toISO(day);
                const vol = volumeMap[iso] ?? 0;
                const isFuture = day > today;
                return (
                  <div
                    key={iso}
                    title={vol > 0 ? `${iso}: ${formatMass(vol, weightUnit)}` : iso}
                    className={[
                      'w-3 h-3 rounded-sm',
                      isFuture ? 'opacity-0' : volumeColor(vol),
                    ].join(' ')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[9px] text-slate-500">Less</span>
        {['bg-slate-200/80 dark:bg-slate-700/20', 'bg-brand-500/25', 'bg-brand-500/55', 'bg-brand-500'].map((c) => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-slate-500">More</span>
      </div>
    </div>
  );
}
