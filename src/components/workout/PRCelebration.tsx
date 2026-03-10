import { useEffect } from 'react';
import type { PersonalRecord } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatWeightValue } from '../../utils/weightUnits';

interface PRCelebrationProps {
  prs: PersonalRecord[];
  onDismiss: () => void;
}

// Generate deterministic confetti pieces
const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5 + 3) % 100}%`,
  delay: `${(i * 0.15) % 2}s`,
  color: [
    '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#ef4444', '#a855f7', '#06b6d4',
  ][i % 8],
  size: 6 + (i % 3) * 3,
}));

export function PRCelebration({ prs, onDismiss }: PRCelebrationProps) {
  const weightUnit = useWeightUnit();
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center"
      onClick={onDismiss}
    >
      {/* Confetti */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {CONFETTI.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animation: `confetti-fall 3s ease-in ${p.delay} forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Content */}
      <div className="text-center px-6 relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          New Personal Record!
        </h2>
        <div className="space-y-1.5 mb-6">
          {prs.map((pr) => {
            const ex = getExerciseById(pr.exerciseId);
            return (
              <div
                key={pr.exerciseId}
                className="flex items-center justify-center gap-2 bg-brand-500/20 border border-brand-500/40 rounded-xl px-4 py-2"
              >
                <span className="text-brand-300 text-sm font-semibold">
                  {ex?.name ?? pr.exerciseId}
                </span>
                <span className="text-white font-bold">
                  {formatWeightValue(pr.weight, weightUnit)}{weightUnit} x {pr.reps}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-slate-400 text-sm">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
