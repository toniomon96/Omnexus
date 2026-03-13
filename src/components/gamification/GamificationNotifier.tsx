import { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { CelebrationOverlay } from './CelebrationOverlay';
import type { PendingCelebration } from '../../types';

/**
 * Mounted once at the app root.
 * Drains the achievement-unlock toast queue and the full-screen celebration queue
 * from AppContext without coupling that logic to any specific page.
 */
export function GamificationNotifier() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [activeCelebration, setActiveCelebration] = useState<PendingCelebration | null>(null);

  // ── Achievement toasts ────────────────────────────────────────────────────
  useEffect(() => {
    if (state.pendingAchievements.length === 0) return;

    // Stagger toasts so they don't stack visually all at once
    state.pendingAchievements.forEach((achievement, i) => {
      const tierEmoji =
        achievement.tier === 'gold' ? '🥇'
        : achievement.tier === 'silver' ? '🥈'
        : '🥉';
      setTimeout(() => {
        toast(
          `${tierEmoji} ${achievement.title} — +${achievement.xpReward} XP`,
          'success',
          4000,
        );
      }, i * 700);
    });

    dispatch({ type: 'CONSUME_ALL_ACHIEVEMENT_UNLOCKS' });
  }, [state.pendingAchievements.length, dispatch, toast]);

  // ── Full-screen celebrations ───────────────────────────────────────────────
  useEffect(() => {
    if (state.pendingCelebrations.length === 0) return;
    if (activeCelebration) return; // wait until the current one is dismissed
    // Pop the first celebration in the queue
    setActiveCelebration(state.pendingCelebrations[0]);
    dispatch({ type: 'CONSUME_CELEBRATION' });
  }, [state.pendingCelebrations.length, activeCelebration, dispatch]);

  if (!activeCelebration) return null;

  return (
    <CelebrationOverlay
      celebration={activeCelebration}
      onDismiss={() => setActiveCelebration(null)}
    />
  );
}
