import { useState, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { toDisplayWeight, toStoredWeight } from '../utils/weightUnits';

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_OPTIONS = [
  { label: '20 kg Olympic', value: 20 },
  { label: '15 kg Women\'s', value: 15 },
  { label: '10 kg EZ Curl', value: 10 },
  { label: '7.5 kg Curl', value: 7.5 },
];

const PLATE_WEIGHTS = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25:   '#ef4444', // red
  20:   '#3b82f6', // blue
  15:   '#eab308', // yellow
  10:   '#22c55e', // green
  5:    '#cbd5e1', // white/slate
  2.5:  '#1e293b', // black
  1.25: '#94a3b8', // gray
};

// ─── Algorithm ────────────────────────────────────────────────────────────────

function calcPlates(targetKg: number, barKg: number): number[] {
  let remaining = (targetKg - barKg) / 2;
  if (remaining <= 0) return [];
  const result: number[] = [];
  for (const plate of PLATE_WEIGHTS) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining -= plate;
      remaining = Math.round(remaining * 1000) / 1000;
    }
  }
  return result;
}

// ─── Barbell SVG ──────────────────────────────────────────────────────────────

function BarbellSVG({ plates, barKg, weightUnit }: { plates: number[]; barKg: number; weightUnit: 'kg' | 'lbs' }) {
  const plateWidth = (w: number) => Math.max(8, Math.min(24, w));
  const plateHeight = (w: number) => Math.max(30, Math.min(80, w * 2.5));

  const totalPlateWidth = plates.reduce((acc, p) => acc + plateWidth(p) + 2, 0);
  const totalW = totalPlateWidth * 2 + 80 + 40; // both sides + collar + sleeve

  return (
    <svg
      width={totalW + 40}
      height={120}
      viewBox={`0 -50 ${totalW + 40} 120`}
      className="overflow-visible"
      style={{ minWidth: 200, display: 'block' }}
      aria-label="Barbell plate diagram"
    >
      {/* Bar sleeve */}
      <rect
        x={20}
        y={-3}
        width={totalW}
        height={6}
        rx={3}
        fill="#64748b"
      />

      {/* Center knurl */}
      <rect
        x={totalPlateWidth + 26}
        y={-6}
        width={48}
        height={12}
        rx={3}
        fill="#334155"
      />

      {/* Plates — left side (reversed) */}
      {(() => {
        let x = totalPlateWidth + 24;
        return [...plates].reverse().map((p, i) => {
          const pw = plateWidth(p);
          const ph = plateHeight(p);
          x -= pw + 2;
          return (
            <rect
              key={`l-${i}`}
              x={x}
              y={-ph / 2}
              width={pw}
              height={ph}
              rx={3}
              fill={PLATE_COLORS[p] ?? '#94a3b8'}
            />
          );
        });
      })()}

      {/* Plates — right side */}
      {(() => {
        let x = totalPlateWidth + 56;
        return plates.map((p, i) => {
          const pw = plateWidth(p);
          const ph = plateHeight(p);
          const el = (
            <rect
              key={`r-${i}`}
              x={x}
              y={-ph / 2}
              width={pw}
              height={ph}
              rx={3}
              fill={PLATE_COLORS[p] ?? '#94a3b8'}
            />
          );
          x += pw + 2;
          return el;
        });
      })()}

      {/* Bar weight label */}
      <text
        x={totalPlateWidth + 50}
        y={20}
        textAnchor="middle"
        fontSize={9}
        fill="#94a3b8"
      >
        {Math.round(toDisplayWeight(barKg, weightUnit))}{weightUnit} bar
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlateCalculatorPage() {
  const weightUnit = useWeightUnit();
  const [barKg, setBarKg] = useState(20);
  const [targetKg, setTargetKg] = useState(60);

  const plates = useMemo(() => calcPlates(targetKg, barKg), [targetKg, barKg]);

  const actualKg = barKg + plates.reduce((s, p) => s + p * 2, 0);
  const targetDisplay = toDisplayWeight(targetKg, weightUnit);
  const actualDisplay = toDisplayWeight(actualKg, weightUnit);

  function step(delta: number) {
    setTargetKg((prev) => Math.max(barKg, Math.round((prev + delta) * 2) / 2));
  }

  // Group plates for summary
  const summary: { weight: number; count: number }[] = [];
  for (const p of plates) {
    const last = summary[summary.length - 1];
    if (last && last.weight === p) last.count++;
    else summary.push({ weight: p, count: 1 });
  }

  return (
    <AppShell>
      <TopBar title="Plate Calculator" />
      <div className="p-4 space-y-5 pb-28">

        {/* Bar selector */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Bar</h2>
          <div className="flex flex-wrap gap-2">
            {BAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setBarKg(opt.value);
                  setTargetKg((prev) => Math.max(opt.value, prev));
                }}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  barKg === opt.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Target weight */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Target Weight</h2>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => step(-2.5)}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
              aria-label={`Decrease by ${weightUnit === 'kg' ? '2.5 kg' : '5 lbs'}`}
            >
              <Minus size={18} />
            </button>
            <div className="text-center">
              <span className="text-4xl font-bold text-slate-100">{Math.round(targetDisplay)}</span>
              <span className="text-lg text-slate-400 ml-1">{weightUnit}</span>
            </div>
            <button
              onClick={() => step(2.5)}
              className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 active:scale-95 transition"
              aria-label={`Increase by ${weightUnit === 'kg' ? '2.5 kg' : '5 lbs'}`}
            >
              <Plus size={18} />
            </button>
          </div>
          <input
            type="range"
            min={toDisplayWeight(barKg, weightUnit)}
            max={toDisplayWeight(300, weightUnit)}
            step={weightUnit === 'kg' ? 2.5 : 5}
            value={targetDisplay}
            onChange={(e) => setTargetKg(toStoredWeight(parseFloat(e.target.value), weightUnit))}
            className="w-full mt-4 accent-brand-500"
          />
        </Card>

        {/* Visual barbell */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Plate Setup</h2>
          {plates.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">No plates needed — just the bar!</p>
          ) : (
            <div className="overflow-x-auto scrollbar-hide py-2">
              <BarbellSVG plates={plates} barKg={barKg} weightUnit={weightUnit} />
            </div>
          )}
          {actualKg !== targetKg && plates.length > 0 && (
            <p className="text-center text-amber-400 text-xs mt-2">
              Closest achievable: {Math.round(actualDisplay)} {weightUnit}
            </p>
          )}
        </Card>

        {/* Summary */}
        {summary.length > 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Per Side</h2>
            <div className="space-y-1.5">
              {summary.map(({ weight, count }) => (
                <div key={weight} className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: PLATE_COLORS[weight] ?? '#94a3b8' }}
                  />
                  <span className="text-slate-200 text-sm">
                    {count} × {Math.round(toDisplayWeight(weight, weightUnit) * 10) / 10} {weightUnit}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {Math.round(toDisplayWeight(count * weight, weightUnit) * 10) / 10} {weightUnit}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 mt-3 pt-2 flex justify-between text-sm">
              <span className="text-slate-400">Total per side</span>
              <span className="font-semibold text-slate-200">
                {Math.round(toDisplayWeight(plates.reduce((s, p) => s + p, 0), weightUnit) * 10) / 10} {weightUnit}
              </span>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
