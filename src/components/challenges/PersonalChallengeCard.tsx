import { useEffect, useState } from 'react';
import { Zap, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { generatePersonalChallenge } from '../../services/adaptService';
import type { AiChallenge } from '../../types';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { toDisplayWeight } from '../../utils/weightUnits';
import type { WeightUnit } from '../../types';

async function loadAiChallenges(userId: string) {
  const { getAiChallenges } = await import('../../lib/db');
  return getAiChallenges(userId);
}

interface PersonalChallengeCardProps {
  userId: string;
  goal: string;
  experienceLevel: string;
  weeklyVolumeKg: number;
  sessionsLast30Days: number;
  avgRpe: number;
}

export function getPersonalChallengeTargetDisplay(
  challenge: Pick<AiChallenge, 'metric' | 'target' | 'unit'>,
  weightUnit: WeightUnit,
): { targetText: string; unitText: string } {
  const normalizedUnit = challenge.unit.trim().toLowerCase();
  const challengeUsesMass = challenge.metric === 'total_volume'
    || normalizedUnit === 'kg'
    || normalizedUnit === 'kgs'
    || normalizedUnit === 'lb'
    || normalizedUnit === 'lbs'
    || normalizedUnit === 'pounds';
  const displayTarget = challengeUsesMass ? toDisplayWeight(challenge.target, weightUnit) : challenge.target;
  const roundedTarget = Math.round(displayTarget * 10) / 10;
  const targetText = Number.isInteger(roundedTarget)
    ? roundedTarget.toLocaleString()
    : roundedTarget.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const unitText = challengeUsesMass ? weightUnit : challenge.unit;

  return { targetText, unitText };
}

export function PersonalChallengeCard({
  userId,
  goal,
  experienceLevel,
  weeklyVolumeKg,
  sessionsLast30Days,
  avgRpe,
}: PersonalChallengeCardProps) {
  const weightUnit = useWeightUnit();
  const [challenge, setChallenge] = useState<AiChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const all = await loadAiChallenges(userId);
        const personal = all.find((c) => c.type === 'personal');
        if (!cancelled) setChallenge(personal ?? null);
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generatePersonalChallenge({
        userId,
        goal,
        experienceLevel,
        recentStats: {
          weeklyVolume: weeklyVolumeKg,
          sessionsLast30Days,
          avgRpe,
        },
      });
      setChallenge(res.challenge);
    } catch {
      // Silently fail; user can retry
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-brand-500" />
          <p className="text-sm font-semibold text-slate-500">Personal Challenge</p>
        </div>
        <Skeleton variant="text" className="w-full mb-2" />
        <Skeleton variant="text" className="w-3/4" />
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 shrink-0">
              <Zap size={16} className="text-brand-500" />
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">Personal Challenge</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-3">Get a personalized 7-day challenge based on your training stats.</p>
        <Button onClick={handleGenerate} disabled={generating} fullWidth size="sm">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {generating ? 'Generating…' : 'Generate My Challenge'}
        </Button>
      </Card>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  const todayDate = new Date(today);
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = totalDays - daysRemaining;
  const progressPct = totalDays > 0 ? Math.min(100, Math.round((daysPassed / totalDays) * 100)) : 0;
  const isActive = challenge.startDate <= today && challenge.endDate >= today;
  const { targetText: displayTargetText, unitText: displayUnit } = getPersonalChallengeTargetDisplay(challenge, weightUnit);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 shrink-0">
            <Zap size={16} className="text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">Personal Challenge</p>
            {isActive && (
              <p className="text-[10px] text-slate-400">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</p>
            )}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-slate-400 hover:text-brand-500 transition-colors p-1"
          title="Generate new challenge"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{challenge.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{challenge.description}</p>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <span>Target: {displayTargetText} {displayUnit}</span>
        <span>{progressPct}% through</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Card>
  );
}
