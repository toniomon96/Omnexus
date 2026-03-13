import { useEffect, useRef, useState } from 'react';
import type { PendingCelebration } from '../../types';
import { ShareCardModal } from '../ui/ShareCardModal';
import { generateStreakMilestoneCard } from '../../utils/shareCard';
import { Share2 } from 'lucide-react';

// ─── Confetti helpers ─────────────────────────────────────────────────────────

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#a855f7', '#06b6d4'];

// Generate deterministic confetti pieces to avoid SSR / hydration mismatches
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.6 + 2) % 100}%`,
  delay: `${(i * 0.12) % 2.4}s`,
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 4) * 2,
}));

// ─── Rank labels for display ──────────────────────────────────────────────────

const RANK_EMOJI: Record<string, string> = {
  Rookie:     '🥉',
  Athlete:    '🥈',
  Contender:  '🥇',
  Competitor: '🏅',
  Elite:      '👑',
};

const STREAK_LABELS: Record<number, string> = {
  7: '7-Day Streak',
  30: '30-Day Streak',
  100: '100-Day Streak',
  365: '365-Day Streak',
};

const STREAK_EMOJI: Record<number, string> = {
  7: '🔥',
  30: '⚡',
  100: '🏆',
  365: '🚀',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CelebrationOverlayProps {
  celebration: PendingCelebration;
  onDismiss: () => void;
}

export function CelebrationOverlay({ celebration, onDismiss }: CelebrationOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  function handleClick() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss();
  }

  function handleShareClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowShareModal(true);
  }

  const isRankUp = celebration.type === 'rank_up';
  const isStreak = celebration.type === 'streak_milestone';

  const emoji = isRankUp
    ? (RANK_EMOJI[celebration.toRank] ?? '🏅')
    : STREAK_EMOJI[(celebration as { type: 'streak_milestone'; streakDays: number }).streakDays] ?? '🔥';

  const heading = isRankUp
    ? 'New Rank!'
    : STREAK_LABELS[(celebration as { type: 'streak_milestone'; streakDays: number }).streakDays] ?? 'Streak Milestone!';

  const subtext = isRankUp
    ? `You've reached Level ${celebration.level} — ${celebration.toRank}`
    : `${(celebration as { type: 'streak_milestone'; streakDays: number }).streakDays} days in a row. Keep it up!`;

  const streakDays = isStreak
    ? (celebration as { type: 'streak_milestone'; streakDays: number }).streakDays
    : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-900/92 flex flex-col items-center justify-center"
        onClick={handleClick}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
      >
        {/* CSS confetti — hidden when prefers-reduced-motion */}
        {!prefersReducedMotion && (
          <>
            <style>{`
              @keyframes cfetti-fall {
                0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(105vh) rotate(800deg); opacity: 0; }
              }
            `}</style>
            {CONFETTI_PIECES.map((p) => (
              <div
                key={p.id}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: 0,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: '2px',
                  animation: `cfetti-fall 3.2s ease-in ${p.delay} forwards`,
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}

        {/* Content card */}
        <div
          className="relative z-10 text-center px-8 max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-7xl mb-5">{emoji}</div>

          <h2 className="text-3xl font-bold text-white mb-2">{heading}</h2>
          <p className="text-base text-slate-300 mb-6 leading-relaxed">{subtext}</p>

          {isRankUp && (
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="text-slate-400 line-through text-sm">{celebration.fromRank}</span>
              <span className="text-slate-500 text-xs">→</span>
              <span className="text-brand-400 font-bold">{celebration.toRank}</span>
            </div>
          )}

          {/* Share button (streak milestones only) */}
          {isStreak && (
            <button
              onClick={handleShareClick}
              className="mb-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Share2 size={15} />
              Share milestone
            </button>
          )}

          <p className="text-slate-500 text-xs mt-2">Tap anywhere to continue</p>
        </div>
      </div>

      {/* Share card modal — only for streak milestones */}
      {isStreak && (
        <ShareCardModal
          open={showShareModal}
          onClose={() => { setShowShareModal(false); onDismiss(); }}
          generate={() => generateStreakMilestoneCard({
            streakDays,
            milestoneLabel: STREAK_LABELS[streakDays] ?? `${streakDays}-Day Streak`,
          })}
          filename={`omnexus-streak-${streakDays}.png`}
          title="Share your streak"
        />
      )}
    </>
  );
}
