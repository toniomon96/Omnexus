import { useState } from 'react';
import { ChevronRight, X, Home, Dumbbell, BookOpen, Sparkles, History } from 'lucide-react';
import { markTutorialSeen } from '../../lib/tutorial';

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: <Home size={32} className="text-brand-400" />,
    color: 'bg-brand-500/15 border-brand-500/30',
    title: 'Your Dashboard',
    body: 'Your home base. Track your next session, streak, AI insights, and recovery score at a glance.',
    tab: 'Home tab',
  },
  {
    icon: <Dumbbell size={32} className="text-emerald-400" />,
    color: 'bg-emerald-500/15 border-emerald-500/30',
    title: 'Train',
    body: 'Start workouts, log every set, and track your personal records over time. Your program guides each session.',
    tab: 'Train tab',
  },
  {
    icon: <BookOpen size={32} className="text-sky-400" />,
    color: 'bg-sky-500/15 border-sky-500/30',
    title: 'Learn',
    body: 'Science-backed courses on training, nutrition, and recovery. Earn points and track your knowledge.',
    tab: 'Learn tab',
  },
  {
    icon: <Sparkles size={32} className="text-violet-400" />,
    color: 'bg-violet-500/15 border-violet-500/30',
    title: 'AI Insights',
    body: 'Ask your AI coach anything. Get personalized analysis of your training grounded in real research.',
    tab: 'Insights tab',
  },
  {
    icon: <History size={32} className="text-amber-400" />,
    color: 'bg-amber-500/15 border-amber-500/30',
    title: 'History',
    body: 'Every workout you log is saved. Review volume trends, personal records, and muscle coverage over time.',
    tab: 'History tab',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onDismiss: () => void;
}

export function AppTutorial({ onDismiss }: Props) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  function next() {
    if (isLast) {
      markTutorialSeen();
      onDismiss();
    } else {
      setIdx(i => i + 1);
    }
  }

  function skip() {
    markTutorialSeen();
    onDismiss();
  }

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            Quick tour · {idx + 1}/{SLIDES.length}
          </p>
          <button
            type="button"
            onClick={skip}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Skip tutorial"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={[
                  'flex-1 h-1 rounded-full transition-all duration-300',
                  i <= idx ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Slide content */}
        <div className="px-5 pt-6 pb-5 space-y-4">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${slide.color}`}>
            {slide.icon}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              {slide.tab}
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{slide.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {slide.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          {!isLast && (
            <button
              type="button"
              onClick={skip}
              className="flex-1 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] rounded-2xl transition-all"
          >
            {isLast ? "Let's go!" : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
