import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { CelebrationOverlay } from './CelebrationOverlay';
import { ACHIEVEMENTS } from '../../data/achievements';
import type { PendingCelebration } from '../../types';

export function GamificationNotifier() {
  const { state, dispatch } = useApp();
  const [activeToast, setActiveToast] = useState<PendingCelebration | null>(null);
  const [activeCelebration, setActiveCelebration] = useState<PendingCelebration | null>(null);

  useEffect(() => {
    if (activeCelebration || activeToast) return;
    const next = state.pendingCelebrations[0];
    if (!next) return;

    if (next.kind === 'achievement') {
      setActiveToast(next);
      dispatch({ type: 'DEQUEUE_CELEBRATION', payload: next.id });
      setTimeout(() => setActiveToast(null), 4000);
    } else {
      setActiveCelebration(next);
      dispatch({ type: 'DEQUEUE_CELEBRATION', payload: next.id });
    }
  }, [state.pendingCelebrations, activeCelebration, activeToast, dispatch]);

  function handleCelebrationDismiss() {
    setActiveCelebration(null);
  }

  const achievement = activeToast ? ACHIEVEMENTS.find((a) => a.id === activeToast.payload) : null;

  return (
    <>
      {activeCelebration && (
        <CelebrationOverlay
          celebration={activeCelebration}
          xpProfile={state.xpProfile}
          onDismiss={handleCelebrationDismiss}
        />
      )}

      {activeToast && achievement && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-xl">{achievement.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy size={12} className="text-amber-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Achievement Unlocked</p>
              </div>
              <p className="text-sm font-semibold text-white truncate">{achievement.title}</p>
              <p className="text-xs text-slate-400 truncate">{achievement.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-amber-400">+{achievement.xpReward}</p>
              <p className="text-[10px] text-slate-500">XP</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
