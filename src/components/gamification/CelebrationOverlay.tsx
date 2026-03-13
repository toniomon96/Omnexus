import { useEffect, useState } from 'react';
import { Trophy, Flame, X } from 'lucide-react';
import { RankBadge } from './RankBadge';
import type { PendingCelebration, XpProfile } from '../../types';

interface CelebrationOverlayProps {
  celebration: PendingCelebration;
  xpProfile: XpProfile | null;
  onDismiss: () => void;
}

export function CelebrationOverlay({ celebration, xpProfile, onDismiss }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    const auto = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => {
      clearTimeout(t);
      clearTimeout(auto);
    };
  }, [onDismiss]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  const isRankUp = celebration.kind === 'rank_up';
  const isStreak = celebration.kind === 'streak_milestone';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleDismiss}
    >
      <div
        className={`relative flex flex-col items-center gap-6 p-8 text-center max-w-sm transition-transform duration-300 ${visible && !prefersReduced ? 'translate-y-0' : 'translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        {isRankUp && (
          <>
            <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
              <Trophy size={32} className="text-brand-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-1">Rank Up!</p>
              <p className="text-3xl font-bold text-white">{celebration.payload}</p>
            </div>
            {xpProfile && <RankBadge xpProfile={xpProfile} />}
            <p className="text-sm text-slate-400">You've reached a new rank. Keep training!</p>
          </>
        )}

        {isStreak && (
          <>
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame size={32} className="text-orange-400" />
            </div>
            <p className="text-6xl font-black text-orange-400">{celebration.payload}</p>
            <div>
              <p className="text-xl font-bold text-white">Day Streak!</p>
              <p className="text-sm text-slate-400 mt-1">
                {celebration.payload === '7'
                  ? 'One full week — great consistency.'
                  : celebration.payload === '30'
                  ? 'A full month of training. Exceptional.'
                  : celebration.payload === '100'
                  ? "100 days. You're in the top 1%."
                  : 'One full year. Legendary dedication.'}
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-slate-500">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
