import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Target, ChevronRight } from 'lucide-react';
import type { BlockMission } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { trackFeatureEntry } from '../../lib/analytics';
import { getMissionProgressLabel } from '../../lib/missionUtils';

interface MomentumFocusCardProps {
  userId: string;
  programId: string | null;
  streak: number;
  sessionsThisWeek: number;
  isGuest: boolean;
}

export function MomentumFocusCard({
  userId,
  programId,
  streak,
  sessionsThisWeek,
  isGuest,
}: MomentumFocusCardProps) {
  const navigate = useNavigate();
  const [activeMission, setActiveMission] = useState<BlockMission | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!programId || isGuest) {
      setActiveMission(null);
      return () => {
        cancelled = true;
      };
    }
    const activeProgramId = programId;

    async function loadMission() {
      try {
        const { getBlockMissions } = await import('../../lib/db');
        const missions = await getBlockMissions(userId, activeProgramId);
        if (cancelled) return;
        const nextMission = missions.find((mission) => mission.status === 'active') ?? null;
        setActiveMission(nextMission);
      } catch {
        if (!cancelled) {
          setActiveMission(null);
        }
      }
    }

    void loadMission();

    return () => {
      cancelled = true;
    };
  }, [isGuest, programId, userId]);

  const streakMessage = useMemo(() => {
    if (streak <= 0) {
      return 'No streak yet. One session today starts your momentum.';
    }
    if (streak === 1) {
      return 'You started a streak. Keep it alive with your next session.';
    }
    return `${streak}-day streak active. Keep the pattern going this week.`;
  }, [streak]);

  const missionProgress = activeMission
    ? getMissionProgressLabel(activeMission)
    : null;

  const cta = activeMission && programId
    ? {
        label: 'Open Mission Progress',
        destination: `/programs/${programId}`,
      }
    : {
        label: sessionsThisWeek > 0 ? 'Plan Next Session' : 'Start This Week',
        destination: '/train',
      };

  function handleCtaClick() {
    trackFeatureEntry({
      source: 'dashboard_momentum_focus',
      destination: cta.destination,
      label: activeMission ? 'mission_progress' : 'streak_progress',
    });
    navigate(cta.destination);
  }

  return (
    <Card className="border-orange-200/70 bg-orange-50/70 dark:border-orange-800/50 dark:bg-orange-900/15" data-testid="dashboard-momentum-focus-card">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500/90 dark:text-orange-300/90">
              Momentum focus
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Keep this week moving
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-900/40 dark:text-orange-300">
            <Flame size={16} />
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          {streakMessage}
        </p>

        {activeMission ? (
          <div className="rounded-xl border border-orange-200/70 bg-white/80 px-3 py-2.5 dark:border-orange-800/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                <Target size={13} className="text-orange-500" />
                <span>Current mission</span>
              </div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">{missionProgress}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeMission.description}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-orange-200/70 bg-white/80 px-3 py-2.5 text-xs text-slate-500 dark:border-orange-800/50 dark:bg-slate-900/40 dark:text-slate-400">
            {sessionsThisWeek > 0
              ? `${sessionsThisWeek} workout${sessionsThisWeek === 1 ? '' : 's'} logged this week. Add one more to reinforce consistency.`
              : 'No sessions this week yet. Start one and build momentum early.'}
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCtaClick}
          data-testid="dashboard-momentum-focus-action"
        >
          {cta.label}
          <ChevronRight size={14} />
        </Button>
      </div>
    </Card>
  );
}