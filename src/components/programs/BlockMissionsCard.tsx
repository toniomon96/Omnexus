import { useEffect, useState } from 'react';
import { Target, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { generateMissions } from '../../services/adaptService';
import { useApp } from '../../store/AppContext';
import type { BlockMission } from '../../types';

async function loadBlockMissions(userId: string, programId: string) {
  const { getBlockMissions } = await import('../../lib/db');
  return getBlockMissions(userId, programId);
}

interface BlockMissionsCardProps {
  programId: string;
  programName: string;
  daysPerWeek: number;
  durationWeeks: number;
}

const TYPE_LABEL: Record<BlockMission['type'], string> = {
  pr: 'Personal Record',
  consistency: 'Consistency',
  volume: 'Volume',
  rpe: 'Effort Control (RPE)',
};

const TYPE_COLOR: Record<BlockMission['type'], string> = {
  pr: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
  consistency: 'text-green-600 dark:text-green-400 bg-green-500/10',
  volume: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  rpe: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
};

export function BlockMissionsCard({ programId, programName, daysPerWeek, durationWeeks }: BlockMissionsCardProps) {
  const { state } = useApp();
  const user = state.user;
  const userId = user?.id ?? '';

  const [missions, setMissions] = useState<BlockMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await loadBlockMissions(userId, programId);
        if (!cancelled) setMissions(data);
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, programId]);

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await generateMissions({
        userId,
        programId,
        programName,
        goal: user.goal,
        experienceLevel: user.experienceLevel,
        daysPerWeek,
        durationWeeks,
      });
      setMissions(res.missions);
    } catch {
      // Silently fail; user can retry
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 shrink-0">
            <Target size={16} className="text-brand-500" />
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-white">Block Missions</p>
        </div>
        {!loading && missions.length === 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-4/5" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      )}

      {!loading && missions.length === 0 && !generating && (
        <p className="text-sm text-slate-400 text-center py-2">
          Generate AI missions to track your progress this block.
        </p>
      )}

      {!loading && missions.length > 0 && (
        <div className="space-y-3">
          {missions.map((m) => {
            const pct = Math.min(100, Math.round((m.progress.current / m.target.value) * 100));
            const isComplete = m.status === 'completed';
            return (
              <div key={m.id}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[m.type]}`}>
                        {TYPE_LABEL[m.type]}
                      </span>
                      {isComplete && <CheckCircle2 size={12} className="text-green-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{m.description}</p>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-slate-500 shrink-0">
                    {m.progress.current}/{m.target.value} {m.target.unit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
