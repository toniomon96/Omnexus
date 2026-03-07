import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Sparkles, MessageCircle, TrendingUp, ChevronRight, Check, Crown, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Program } from '../../types';

interface Props {
  userName: string;
  programPromise: Promise<Program | null>;
  signupPromise: Promise<{ userId: string; token: string | null } | null>;
  onComplete: (program: Program, userId: string, token: string | null) => void;
  onError: (msg: string) => void;
}

// ─── Slide definitions ──────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: <Sparkles size={40} className="text-brand-400" />,
    title: 'Welcome to Omnexus',
    body: 'You\'re about to get a fully personalized 8-week training program built around your goals, experience, and schedule — not a generic template.',
    accent: 'Your program is generating now.',
  },
  {
    icon: <Dumbbell size={40} className="text-emerald-400" />,
    title: 'Track Every Workout',
    body: 'Log sets, track personal records, and see your volume history over time. Omnexus adapts your program based on how you actually train.',
    accent: 'Your training history powers the AI.',
  },
  {
    icon: <MessageCircle size={40} className="text-sky-400" />,
    title: 'Ask Your AI Coach',
    body: 'Get science-backed answers to any training question — nutrition, recovery, form, or program design — grounded in real research from PubMed.',
    accent: 'Available anytime from the Insights tab.',
  },
  {
    icon: <TrendingUp size={40} className="text-violet-400" />,
    title: 'What\'s Included',
    body: null, // rendered separately as tier comparison
    accent: null,
  },
];

const SLIDE_DURATION_MS = 7000;

// ─── Feature tier comparison ─────────────────────────────────────────────────

const FREE_FEATURES = [
  'AI-generated 8-week program',
  'Workout logging + history',
  'Exercise library with demos',
  'Learning courses',
  'Basic AI insights',
];

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Unlimited AI coaching (Ask Omnexus)',
  'Source-grounded research answers',
  'Peer insights + community challenges',
  'Priority AI response speed',
];

function TierSlide() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white text-center">What's Included</h2>
      <p className="text-slate-400 text-sm text-center">Your free account gives you everything you need to start.</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Free */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Free</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-tight">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Premium */}
        <div className="rounded-2xl border border-brand-500/40 bg-brand-900/30 p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Crown size={13} className="text-brand-400" />
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Premium</p>
          </div>
          <ul className="space-y-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={13} className="text-brand-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200 leading-tight">{f}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-brand-400/80 font-medium">$12.99/month · cancel anytime</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">You can upgrade anytime from your Profile.</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function WelcomeTutorial({ userName, programPromise, signupPromise, onComplete, onError }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [slideDone, setSlideDone] = useState(false); // all slides viewed
  const [program, setProgram] = useState<Program | null>(null);
  const [signupResult, setSignupResult] = useState<{ userId: string; token: string | null } | null>(null);
  const [resolving, setResolving] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve promises in background
  useEffect(() => {
    programPromise.then((p) => { if (p) setProgram(p); });
    signupPromise.then((s) => { if (s) setSignupResult(s); });
  }, [programPromise, signupPromise]);

  // Progress bar + auto-advance
  useEffect(() => {
    if (slideDone) return;
    setProgress(0);
    const step = 100 / (SLIDE_DURATION_MS / 100);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p + step >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
          advanceSlide();
          return 100;
        }
        return p + step;
      });
    }, 100);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx, slideDone]);

  function advanceSlide() {
    setSlideIdx((i) => {
      const next = i + 1;
      if (next >= SLIDES.length) {
        setSlideDone(true);
        return i;
      }
      return next;
    });
  }

  function handleNext() {
    if (progressRef.current) clearInterval(progressRef.current);
    if (slideIdx < SLIDES.length - 1) {
      advanceSlide();
    } else {
      setSlideDone(true);
    }
  }

  async function handleEnter() {
    if (!program || !signupResult) {
      setResolving(true);
      try {
        const [p, s] = await Promise.all([programPromise, signupPromise]);
        if (!p || !s) {
          onError('Something went wrong setting up your account. Please try again.');
          return;
        }
        onComplete(p, s.userId, s.token);
      } catch {
        onError('Something went wrong. Please try again.');
      } finally {
        setResolving(false);
      }
    } else {
      onComplete(program, signupResult.userId, signupResult.token);
    }
  }

  const bothReady = !!program && !!signupResult;
  const slide = SLIDES[slideIdx];

  // ─── All slides done — waiting/ready screen ─────────────────────────────

  if (slideDone) {
    return (
      <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-12 items-center justify-center">
        <div className="max-w-sm w-full space-y-8 text-center">
          {bothReady ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check size={36} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Your program is ready!</h1>
                <p className="mt-2 text-slate-400 text-sm">
                  Your personalized 8-week plan is waiting for you.
                </p>
              </div>
              <Button onClick={handleEnter} fullWidth size="lg">
                <Sparkles size={18} />
                Enter Omnexus
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto">
                <Loader2 size={36} className="text-brand-400 animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Almost there, {userName}…</h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Your AI coach is finalizing your 8-week program. Great training plans take a moment to craft.
                </p>
              </div>
              <div className="space-y-2 text-left rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">While you wait</p>
                {[
                  'Your program is based on real periodization science',
                  'Sets, reps, and RIR targets are calculated per week',
                  'You can swap exercises anytime from the Library',
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <span className="text-brand-400 text-xs mt-0.5">→</span>
                    <p className="text-sm text-slate-300">{tip}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleEnter}
                disabled={resolving}
                fullWidth
                size="lg"
              >
                {resolving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Waiting for program…
                  </>
                ) : (
                  'Enter Omnexus when ready'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Slide view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-10">
      {/* Slide progress indicators */}
      <div className="flex gap-1.5 mb-10">
        {SLIDES.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-slate-700/60">
            <div
              className="h-full bg-brand-500 rounded-full transition-none"
              style={{
                width: i < slideIdx ? '100%' : i === slideIdx ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {/* Slide content */}
        <div className="space-y-6">
          {slide.body !== null ? (
            <>
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                  {slide.icon}
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
                <p className="text-slate-300 text-base leading-relaxed">{slide.body}</p>
                {slide.accent && (
                  <p className="text-sm font-medium text-brand-400">{slide.accent}</p>
                )}
              </div>
            </>
          ) : (
            <TierSlide />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all text-white font-semibold text-base py-4"
          >
            {slideIdx < SLIDES.length - 1 ? (
              <>Next <ChevronRight size={18} /></>
            ) : (
              <>See your status <ChevronRight size={18} /></>
            )}
          </button>
          {slideIdx < SLIDES.length - 1 && (
            <button
              type="button"
              onClick={() => setSlideDone(true)}
              className="w-full text-sm text-slate-500 hover:text-slate-400 py-2"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
