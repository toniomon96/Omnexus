import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as db from '../lib/db';
import type { Measurement, MeasurementMetric, MeasurementUnit } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MeasurementChart from '../components/measurements/MeasurementChart';
import { today } from '../utils/dateUtils';

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
  weight:      'kg',
  'body-fat':  '%',
  waist:       'cm',
  chest:       'cm',
  'left-arm':  'cm',
  'right-arm': 'cm',
  hips:        'cm',
  thighs:      'cm',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MeasurementsPage() {
  const { state } = useApp();
  const { session } = useAuth();
  const navigate = useNavigate();

  const { toast } = useToast();

  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetric>('weight');
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  // Guest redirect
  useEffect(() => {
    if (!session && !state.user?.isGuest) return;
    if (state.user?.isGuest) {
      navigate('/');
    }
  }, [session, state.user, navigate]);

  const userId = state.user?.id ?? '';

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await db.fetchMeasurements(userId, selectedMetric);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [selectedMetric, userId]);

  const unit = UNIT_MAP[selectedMetric];

  async function handleAdd() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || !userId) return;
    setSaving(true);
    try {
      const added = await db.addMeasurement({
        userId,
        metric: selectedMetric,
        value: num,
        unit,
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
      await db.deleteMeasurement(id, state.user.id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast('Entry deleted', 'success');
    } catch {
      toast('Failed to delete entry', 'error');
    }
  }

  const chartData = entries.map((e) => ({ date: e.measuredAt, value: e.value }));

  return (
    <AppShell>
      <TopBar title="Body Measurements" />
      <div className="p-4 space-y-5 pb-28">

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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add entry */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-slate-200 text-sm">Add Entry</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Value (${unit})`}
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
          <h2 className="font-semibold text-slate-200 text-sm mb-3">Trend</h2>
          {loading ? (
            <div className="h-36 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <MeasurementChart data={chartData} unit={unit} />
          )}
        </Card>

        {/* Entry list */}
        {entries.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold text-slate-200 text-sm mb-3">Entries</h2>
            <div className="space-y-2">
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{entry.measuredAt}</span>
                  <span className="font-semibold text-slate-200">
                    {entry.value} {entry.unit}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
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
          <p className="text-center text-slate-500 text-sm">
            No entries yet. Add your first {METRICS.find((m) => m.key === selectedMetric)?.label.toLowerCase()} measurement.
          </p>
        )}
      </div>
    </AppShell>
  );
}
