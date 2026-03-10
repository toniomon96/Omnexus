import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession, PersonalRecord, AdaptationResult } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShareCardModal } from '../ui/ShareCardModal';
import { NextSessionTab } from './NextSessionTab';
import { formatDuration } from '../../utils/dateUtils';
import { getExerciseById } from '../../data/exercises';
import { generatePRCard } from '../../utils/shareCard';
import { Trophy, Timer, Zap, Star, Share2, ChevronRight, Loader2, History, MessageCircle } from 'lucide-react';
import { triggerHapticNotification } from '../../lib/capacitor';
import { getAdaptation } from '../../services/adaptService';
import { useApp } from '../../store/AppContext';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { formatMass, formatWeightValue, toDisplayWeight } from '../../utils/weightUnits';

interface WorkoutCompleteModalProps {
  open: boolean;
  session: WorkoutSession;
  prs: PersonalRecord[];
}

/** Lightweight canvas confetti — no external library needed */
function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    triggerHapticNotification('success'); // native PR celebration haptic; no-op on web

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;
    const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    let frame = 0;
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05; // gravity
        if (frame > 60) p.opacity -= 0.015;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (frame < 140) rafRef.current = requestAnimationFrame(tick);
      else cleanup();
    }

    rafRef.current = requestAnimationFrame(tick);

    function cleanup() {
      cancelAnimationFrame(rafRef.current);
      canvas.remove();
    }

    return cleanup;
  }, [active]);
}

type Tab = 'summary' | 'next';

export function WorkoutCompleteModal({
  open,
  session,
  prs,
}: WorkoutCompleteModalProps) {
  const navigate = useNavigate();
  const { state } = useApp();
  const weightUnit = useWeightUnit();
  const hasPRs = prs.length > 0;
  useConfetti(open && hasPRs);

  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [adaptation, setAdaptation] = useState<AdaptationResult | null>(null);
  const [adaptLoading, setAdaptLoading] = useState(false);

  // Fetch adaptation on open
  useEffect(() => {
    if (!open || !state.user || state.user.isGuest) return;
    let cancelled = false;

    async function fetchAdaptation() {
      setAdaptLoading(true);
      try {
        const exerciseSets = session.exercises
          .filter((e) => e.sets.some((s) => s.completed))
          .map((e) => {
            const ex = getExerciseById(e.exerciseId);
            return {
              exerciseId: e.exerciseId,
              exerciseName: ex?.name ?? e.exerciseId,
              sets: e.sets,
            };
          });

        if (exerciseSets.length === 0) return;

        const result = await getAdaptation({
          sessionId: session.id,
          userId: state.user!.id,
          exerciseSets,
        });

        if (!cancelled) {
          setAdaptation(result);
          // Persist to localStorage for InsightsPage
          localStorage.setItem('omnexus_last_adaptation', JSON.stringify({
            ...result,
            savedAt: new Date().toISOString(),
          }));
        }
      } catch {
        // Non-fatal: tab will show a message
      } finally {
        if (!cancelled) setAdaptLoading(false);
      }
    }

    void fetchAdaptation();
    return () => { cancelled = true; };
  }, [open]);

  // Pick the PR with the highest weight to feature on the share card
  const featuredPR = hasPRs
    ? prs.reduce((best, pr) => (pr.weight > best.weight ? pr : best))
    : null;

  const totalSets = session.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <Modal open={open} title="Workout Complete! 🎉">
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {(['summary', 'next'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'summary' ? 'Summary' : 'Next Session'}
              {tab === 'next' && adaptLoading && (
                <Loader2 size={10} className="inline ml-1 animate-spin" />
              )}
            </button>
          ))}
        </div>

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Timer size={18} className="text-brand-500" />,
                  label: 'Duration',
                  value: formatDuration(session.durationSeconds ?? 0),
                },
                {
                  icon: <Zap size={18} className="text-orange-500" />,
                  label: 'Volume',
                  value: formatMass(session.totalVolumeKg, weightUnit),
                },
                {
                  icon: <Trophy size={18} className="text-yellow-500" />,
                  label: 'Sets',
                  value: String(totalSets),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"
                >
                  {stat.icon}
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* PRs */}
            {hasPRs && (
              <div
                className="rounded-2xl border-2 border-yellow-400 dark:border-yellow-500 overflow-hidden"
                style={{ animation: 'prGlow 0.6s ease-out' }}
              >
                {/* Header */}
                <div className="flex items-center justify-center gap-2 bg-yellow-400 dark:bg-yellow-500 px-4 py-2.5">
                  <Star size={16} className="text-yellow-900 fill-yellow-900" />
                  <p className="text-sm font-bold text-yellow-900 tracking-wide uppercase">
                    Personal Record{prs.length > 1 ? 's' : ''}!
                  </p>
                  <Star size={16} className="text-yellow-900 fill-yellow-900" />
                </div>

                {/* PR rows */}
                <ul className="divide-y divide-yellow-200 dark:divide-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/20">
                  {prs.map((pr, i) => {
                    const ex = getExerciseById(pr.exerciseId);
                    return (
                      <li
                        key={pr.exerciseId}
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{ animation: `prSlideIn 0.35s ease-out ${i * 80}ms both` }}
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {ex?.name ?? pr.exerciseId}
                        </span>
                        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                          {formatWeightValue(pr.weight, weightUnit)} {weightUnit} x {pr.reps}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Share PR card */}
            {hasPRs && featuredPR && (
              <Button
                variant="ghost"
                onClick={() => setShowShareModal(true)}
                fullWidth
              >
                <Share2 size={15} />
                Share your PR
              </Button>
            )}

            {/* CTA to Next Session tab */}
            {(adaptation || adaptLoading) && (
              <button
                onClick={() => setActiveTab('next')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-sm text-brand-600 dark:text-brand-400 font-medium"
              >
                <span>View next session suggestions</span>
                <ChevronRight size={16} />
              </button>
            )}

            {/* Ask AI about this workout */}
            <button
              type="button"
              onClick={() => navigate('/ask', {
                state: { prefill: `I just finished a workout with ${totalSets} sets and ${formatMass(session.totalVolumeKg, weightUnit)} total volume. How did I do and what should I focus on next session?` },
              })}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
            >
              <MessageCircle size={14} className="text-brand-500 shrink-0" />
              <span>Ask Omnexus about this workout</span>
              <ChevronRight size={14} className="ml-auto text-slate-400 shrink-0" />
            </button>

            <div className="flex gap-2">
              <Button onClick={() => navigate('/')} fullWidth size="lg">
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/history')} fullWidth size="lg">
                <History size={16} />
                History
              </Button>
            </div>
          </>
        )}

        {/* Next Session tab */}
        {activeTab === 'next' && (
          <>
            {adaptLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={28} className="animate-spin text-brand-500" />
                <p className="text-sm text-slate-500">Analyzing your session…</p>
              </div>
            ) : adaptation ? (
              <NextSessionTab result={adaptation} />
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No adaptation data available.</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')} fullWidth size="lg">
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/history')} fullWidth size="lg">
                <History size={16} />
                History
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Share modal — rendered outside the main modal so stacking works */}
      {featuredPR && (
        <ShareCardModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share your PR"
          filename={`omnexus-pr-${featuredPR.exerciseId}.png`}
          generate={() => {
            const ex = getExerciseById(featuredPR.exerciseId);
            return generatePRCard({
              exerciseName: ex?.name ?? featuredPR.exerciseId,
              weight: Math.round(toDisplayWeight(featuredPR.weight, weightUnit)),
              reps: featuredPR.reps,
              weightUnit,
              date: new Date().toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
            });
          }}
        />
      )}

      {/* PR animations */}
      <style>{`
        @keyframes prGlow {
          0%   { transform: scale(0.92); opacity: 0; }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes prSlideIn {
          from { transform: translateX(-12px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </Modal>
  );
}
