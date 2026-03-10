import type { ExerciseDataPoint } from '../../utils/volumeUtils';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatWeightValue } from '../../utils/weightUnits';

interface ExerciseProgressChartProps {
  data: ExerciseDataPoint[];
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ExerciseProgressChart({ data }: ExerciseProgressChartProps) {
  const weightUnit = useWeightUnit();
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        No data yet — log this exercise to track your progress.
      </p>
    );
  }

  if (data.length === 1) {
    const pt = data[0];
    return (
      <div className="text-center py-2">
        <p className="text-2xl font-bold text-brand-500">{formatWeightValue(pt.estimated1RM, weightUnit)} {weightUnit}</p>
        <p className="text-xs text-slate-400 mt-0.5">Estimated 1RM · {formatShortDate(pt.date)}</p>
        <p className="text-xs text-slate-400 mt-1">Log more sessions to see your trend.</p>
      </div>
    );
  }

  // SVG line chart
  const W = 300;
  const H = 100;
  const padL = 40;
  const padR = 8;
  const padT = 8;
  const padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = data.map((d) => d.estimated1RM);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  function xPos(i: number) {
    return padL + (i / (data.length - 1)) * chartW;
  }
  function yPos(v: number) {
    return padT + chartH - ((v - minVal) / range) * chartH;
  }

  const polylinePoints = data
    .map((d, i) => `${xPos(i).toFixed(1)},${yPos(d.estimated1RM).toFixed(1)}`)
    .join(' ');

  // Y-axis ticks: min and max
  const yTicks = [minVal, maxVal];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Estimated 1RM progression chart"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={yPos(tick)}
              x2={W - padR}
              y2={yPos(tick)}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
            <text
              x={padL - 4}
              y={yPos(tick) + 4}
              textAnchor="end"
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.4}
            >
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--color-brand-500, #6366f1)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xPos(i)}
            cy={yPos(d.estimated1RM)}
            r={3}
            fill="var(--color-brand-500, #6366f1)"
          />
        ))}

        {/* X-axis labels — show first, middle, last */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((idx, pos, arr) => arr.indexOf(idx) === pos)
          .map((idx) => (
            <text
              key={idx}
              x={xPos(idx)}
              y={H - 4}
              textAnchor="middle"
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.4}
            >
              {formatShortDate(data[idx].date)}
            </text>
          ))}
      </svg>

      {/* Latest stat */}
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-slate-400">Estimated 1RM over time</span>
        <span className="text-xs font-semibold text-brand-500">
          {formatWeightValue(data[data.length - 1].estimated1RM, weightUnit)} {weightUnit}
        </span>
      </div>
    </div>
  );
}
