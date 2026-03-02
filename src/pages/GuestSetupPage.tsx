import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { setGuestProfile } from '../utils/localStorage';
import { programs } from '../data/programs';
import type { Goal, ExperienceLevel } from '../types';
import { Dumbbell, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: 'hypertrophy', label: 'Build Muscle', desc: 'Maximise size and strength', emoji: '💪' },
  { value: 'fat-loss', label: 'Lose Fat', desc: 'Lean out while preserving muscle', emoji: '🔥' },
  { value: 'general-fitness', label: 'Stay Fit', desc: 'Improve overall health and energy', emoji: '⚡' },
];

const LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Less than 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years of training experience' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years, comfortable with complex lifts' },
];

export function GuestSetupPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [step, setStep] = useState<0 | 1>(0);
  const [goal, setGoal] = useState<Goal>('general-fitness');
  const [level, setLevel] = useState<ExperienceLevel>('beginner');

  function finish() {
    // Pick a sensible default program based on goal + level
    const recommended =
      programs.find((p) => p.goal === goal && p.experienceLevel === level) ??
      programs[0];

    const guestUser = {
      id: `guest_${crypto.randomUUID()}`,
      name: 'You',
      goal,
      experienceLevel: level,
      activeProgramId: recommended.id,
      onboardedAt: new Date().toISOString(),
      theme: 'dark' as const,
      isGuest: true,
    };

    setGuestProfile(guestUser);
    dispatch({ type: 'SET_USER', payload: guestUser });
    navigate('/', { replace: true });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4">
          <Dumbbell size={26} className="text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quick setup</h1>
        <p className="mt-1.5 text-slate-400 text-sm text-center max-w-xs">
          No account needed — get started in seconds.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="max-w-sm w-full mx-auto flex-1">
        {/* Step 0 — Goal */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">What's your main goal?</h2>
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={[
                  'w-full flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all',
                  goal === g.value
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600',
                ].join(' ')}
              >
                <span className="text-3xl">{g.emoji}</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{g.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                </div>
                {goal === g.value && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-brand-500 flex-shrink-0" />
                )}
              </button>
            ))}
            <Button fullWidth size="lg" className="mt-6" onClick={() => setStep(1)}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* Step 1 — Experience */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your experience level?</h2>
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={[
                  'w-full flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all',
                  level === l.value
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600',
                ].join(' ')}
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{l.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.desc}</p>
                </div>
                {level === l.value && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-brand-500 flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button size="lg" onClick={finish} className="flex-1">
                Start Training
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-600 mt-8">
        Data saved locally on this device only.{' '}
        <button
          onClick={() => navigate('/onboarding')}
          className="text-brand-500 hover:text-brand-400 underline"
        >
          Create an account
        </button>{' '}
        to sync across devices.
      </p>
    </div>
  );
}
