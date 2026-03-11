import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { Measurement, MeasurementMetric, MeasurementUnit } from '../types';
import {
  getMeasurements as getStoredMeasurements,
  saveMeasurement as saveStoredMeasurement,
  removeMeasurement as removeStoredMeasurement,
} from '../utils/localStorage';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MeasurementChart from '../components/measurements/MeasurementChart';
import { today } from '../utils/dateUtils';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { toDisplayWeight, toStoredWeight } from '../utils/weightUnits';

// ─── Constants ────────────────────────────────────────────────────────────────

const METRICS: { key: MeasurementMetric; label: string }[] = [
  { key: 'weight',    label: 'Weight' },
  { key: 'body-fat',  label: 'Body Fat' },
  { key: 'waist',     label: 'Waist' },
  { key: 'chest',     label: 'Chest' },
  { key: 'left-arm',  label: 'Left Arm' },
  { key: 'right-arm', label: 'Right Arm' },
  { key: 'hips',      label: 'Hips' },
  { key: 'thighs',    label: 'Thighs' },
];

const UNIT_MAP: Record<MeasurementMetric, MeasurementUnit> = {
  weight:      'lbs',
  'body-fat':  '%',
  waist:       'cm',
  chest:       'cm',
  'left-arm':  'cm',
  'right-arm': 'cm',
  hips:        'cm',
  thighs:      'cm',
};

async function loadMeasurementsFromDb(userId: string, metric: MeasurementMetric) {
  const db = await import('../lib/db');
  return db.fetchMeasurements(userId, metric);
}

async function addMeasurementToDb(measurement: {
  userId: string;
  metric: MeasurementMetric;
  value: number;
  unit: MeasurementUnit;
  measuredAt: string;
}) {
  const db = await import('../lib/db');
  return db.addMeasurement(measurement);
}

async function deleteMeasurementFromDb(id: string, userId: string) {
  const db = await import('../lib/db');
  return db.deleteMeasurement(id, userId);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MeasurementsPage() {
  const { state } = useApp();
  const weightUnit = useWeightUnit();

  const { toast } = useToast();

  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetric>('weight');
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const userId = state.user?.id ?? '';
  const isGuest = !!state.user?.isGuest;

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = isGuest
        ? getStoredMeasurements(userId, selectedMetric)
        : await loadMeasurementsFromDb(userId, selectedMetric);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedMetric, userId]);

  const unit: MeasurementUnit = selectedMetric === 'weight' ? weightUnit : UNIT_MAP[selectedMetric];

  const metricCopy: Record<MeasurementMetric, { label: string; placeholder: string; hint: string }> = {
    weight: {
      label: `Enter your body weight (${unit})`,
      placeholder: unit === 'lbs' ? 'Example: 180' : 'Example: 82',
      hint: 'Track at the same time of day for cleaner trends.',
    },
    'body-fat': {
      label: 'Enter your body-fat percentage (%)',
      placeholder: 'Example: 22',
      hint: 'Use the same device/method each time for consistency.',
    },
    waist: {
      label: 'Enter your waist measurement (cm)',
      placeholder: 'Example: 86',
      hint: 'Measure at your navel, relaxed stance, after exhale.',
    },
    chest: {
      label: 'Enter your chest measurement (cm)',
      placeholder: 'Example: 102',
      hint: 'Wrap tape around the fullest part of your chest.',
    },
    'left-arm': {
      label: 'Enter your left arm measurement (cm)',
      placeholder: 'Example: 34',
      hint: 'Measure midpoint between shoulder and elbow.',
    },
    'right-arm': {
      label: 'Enter your right arm measurement (cm)',
      placeholder: 'Example: 34',
      hint: 'Keep arm relaxed and use consistent tape tension.',
    },
    hips: {
      label: 'Enter your hip measurement (cm)',
      placeholder: 'Example: 97',
      hint: 'Measure around the widest point of your hips.',
    },
    thighs: {
      label: 'Enter your thigh measurement (cm)',
      placeholder: 'Example: 56',
      hint: 'Measure at the same point on each leg every time.',
    },
  };

  function toDisplayMeasurement(entry: Measurement): number {
    if (entry.metric !== 'weight') return entry.value;
    const storedKg = entry.unit === 'lbs' ? toStoredWeight(entry.value, 'lbs') : entry.value;
    return toDisplayWeight(storedKg, weightUnit);
  }

  async function handleAdd() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || !userId) return;
    setSaving(true);
    try {
      const storedValue = selectedMetric === 'weight' ? toStoredWeight(num, weightUnit) : num;
      const storedUnit: MeasurementUnit = selectedMetric === 'weight' ? 'kg' : unit;
      const added = isGuest
        ? saveStoredMeasurement({
            userId,
            metric: selectedMetric,
            value: storedValue,
            unit: storedUnit,
            measuredAt: date,
          })
        : await addMeasurementToDb({
            userId,
            metric: selectedMetric,
            value: storedValue,
            unit: storedUnit,
            measuredAt: date,
          });
      if (added) {
        setEntries((prev) =>
          [...prev, added].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)),
        );
        setValue('');
        toast('Entry added', 'success');
      }
    } catch {
      toast('Failed to add entry', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!state.user?.id) return;
    try {
      if (isGuest) {
        removeStoredMeasurement(id, state.user.id);
      } else {
        await deleteMeasurementFromDb(id, state.user.id);
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast('Entry deleted', 'success');
    } catch {
      toast('Failed to delete entry', 'error');
    }
  }

  const chartData = entries.map((e) => ({ date: e.measuredAt, value: toDisplayMeasurement(e) }));

  return (
    <AppShell>
      <TopBar title="Body Measurements" />
      <div className="p-4 space-y-5 pb-28">

        {isGuest && (
          <Card className="border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="text-sm text-brand-800 dark:text-brand-200">
              Guest entries stay on this device. Create an account later to keep cloud-synced progress.
            </p>
          </Card>
        )}

        {/* Metric selector */}
        <div className="flex flex-wrap gap-2">
          {METRICS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedMetric === key
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add entry */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Add Entry</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                label={metricCopy[selectedMetric].label}
                placeholder={metricCopy[selectedMetric].placeholder}
                hint={metricCopy[selectedMetric].hint}
                min={0}
                step={0.1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                {unit}
              </span>
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={saving || !value}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {saving ? 'Adding…' : 'Add Entry'}
          </Button>
        </Card>

        {/* Trend chart */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Trend</h2>
          {loading ? (
            <div className="flex h-36 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>
          ) : (
            <MeasurementChart data={chartData} unit={unit} />
          )}
        </Card>

        {/* Entry list */}
        {entries.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Entries</h2>
            <div className="space-y-2">
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-slate-200 py-1.5 last:border-0 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{entry.measuredAt}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {selectedMetric === 'weight'
                      ? `${Math.round(toDisplayMeasurement(entry) * 10) / 10} ${weightUnit}`
                      : `${entry.value} ${entry.unit}`}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {entries.length === 0 && !loading && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            No entries yet. Add your first {METRICS.find((m) => m.key === selectedMetric)?.label.toLowerCase()} entry to start tracking trends over time.
          </p>
        )}
      </div>
    </AppShell>
  );
}
