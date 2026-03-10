import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw, Loader2 } from 'lucide-react';
import type { UserTrainingProfile, ExperienceLevel } from '../../types';
import { OnboardingChat } from './OnboardingChat';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { setUser, resetProgramCursors, getHistory } from '../../utils/localStorage';
import { apiBase } from '../../lib/api';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { startGeneration } from '../../lib/programGeneration';

async function signOutAuthSession() {
  const { supabase } = await import('../../lib/supabase');
  return supabase.auth.signOut();
}

async function resendSignupConfirmation(email: string) {
  const { supabase } = await import('../../lib/supabase');
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

async function upsertTrainingProfileToDb(userId: string, profile: UserTrainingProfile) {
  const { upsertTrainingProfile } = await import('../../lib/db');
  return upsertTrainingProfile(userId, profile);
}

async function migrateGuestHistory(userId: string): Promise<void> {
  const history = getHistory();
  if (history.sessions.length === 0 && history.personalRecords.length === 0) return;

  const { upsertSession, upsertPersonalRecords } = await import('../../lib/db');
  await Promise.all([
    ...history.sessions.map((session) => upsertSession(session, userId)),
    upsertPersonalRecords(history.personalRecords, userId),
  ]);
}

/** Migrate any guest workout history + PRs to Supabase after account creation. Fire-and-forget. */
function migrateGuestData(userId: string): void {
  void migrateGuestHistory(userId).catch((err) => {
    console.warn('[OnboardingForm] Guest data migration failed:', err);
  });
}

// Step 0: Account, Step 1: Name, Step 2: AI Chat, Step 3: Profile summary + kick-off
const STEPS = ['Account', 'Name', 'Discover', 'Your Plan'];

export function OnboardingForm() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { session } = useAuth();

  // Repair mode: user already has a Supabase auth account but is missing a profiles row
  const repairMode = !!session;

  const [step, setStep] = useState(repairMode ? 1 : 0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<UserTrainingProfile | null>(null);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Generating UI state for ProfileSummaryCard
  const [generating, setGenerating] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(0);
  const [generateError, setGenerateError] = useState('');

  // Cycle through generating messages while generation is in progress
  useEffect(() => {
    if (!generating) { setGeneratingIdx(0); return; }
    const id = setInterval(() => {
      setGeneratingIdx(i => (i + 1) % 4);
    }, 3000);
    return () => clearInterval(id);
  }, [generating]);

  // Email confirmation pending screen
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  function back() { setStep(s => Math.max(s - 1, 0)); }

  async function handleGoToSignIn() {
    await signOutAuthSession();
    navigate('/login');
  }

  function nextFromAccount() {
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) { setEmailError('Please enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Please enter a valid email'); return; }
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    setStep(1);
  }

  function nextFromName() {
    if (!name.trim()) { setNameError('Please enter your name'); return; }
    setNameError('');
    setStep(2);
  }

  function handleProfileComplete(aiProfile: UserTrainingProfile) {
    setProfile(aiProfile);
    setStep(3);
  }

  async function handleResendConfirmation() {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendSignupConfirmation(email);
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  }

  /**
   * Called when the user clicks "Generate My Program".
   *
   * New async flow — no blocking wait:
   * 1. Create the Supabase account (fast ~1s)
   * 2. Fire program generation in the background (non-blocking)
   * 3. Create the profile row in Supabase (no activeProgramId yet — set when generation completes)
   * 4. Navigate: email confirmation screen OR straight into the app
   *
   * The generation continues running in the background via programGeneration.ts.
   * The dashboard will show a "building" card and activate the program when done.
   */
  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setGenerateError('');
    setSubmitError('');

    let userId: string;
    let sessionAccessToken: string | null = null;

    try {
      if (repairMode && session) {
        userId = session.user.id;
        sessionAccessToken = session.access_token;
      } else {
        // 1. Create auth account
        const signupRes = await fetch(`${apiBase}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            redirectTo: `${window.location.origin}/auth/callback`,
          }),
        });
        const signupBody = await signupRes.json().catch(() => ({})) as { userId?: string; error?: string };

        if (!signupRes.ok) {
          const msg = signupBody.error ?? 'Account creation failed. Please try again.';
          const isExisting = signupRes.status === 409 || /already exists|already registered/i.test(msg);
          setSubmitError(isExisting
            ? 'An account with this email already exists. Please sign in instead.'
            : msg);
          setStep(0);
          setGenerating(false);
          return;
        }

        if (!signupBody.userId) {
          setSubmitError('Account creation failed. Please try again.');
          setStep(0);
          setGenerating(false);
          return;
        }

        userId = signupBody.userId;
      }

      // 2. Map AI profile → legacy User fields
      const primaryGoal = (profile.goals[0] ?? 'general-fitness') as 'hypertrophy' | 'fat-loss' | 'general-fitness';
      const experienceLevel: ExperienceLevel = profile.trainingAgeYears === 0
        ? 'beginner'
        : profile.trainingAgeYears <= 2 ? 'intermediate' : 'advanced';

      // 3. Fire program generation in the background — do NOT await
      //    The generation singleton tracks progress; the dashboard will react when ready.
      startGeneration(userId, profile).catch(err => {
        console.error('[OnboardingForm] Background generation error:', err);
      });

      // 4. Create profile row (no activeProgramId yet — will be set on generation complete)
      const profileHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionAccessToken) profileHeaders['Authorization'] = `Bearer ${sessionAccessToken}`;

      const profileRes = await fetch(`${apiBase}/api/setup-profile`, {
        method: 'POST',
        headers: profileHeaders,
        body: JSON.stringify({ userId, name: name.trim(), goal: primaryGoal, experienceLevel }),
      });

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({})) as { error?: string };
        if (!repairMode) await signOutAuthSession();
        const serverErr = body.error ?? '';
        setSubmitError(profileRes.status === 401
          ? 'An account with this email already exists. Please sign in instead.'
          : serverErr || 'Profile setup failed. Please try again.');
        if (!repairMode) setStep(0);
        setGenerating(false);
        return;
      }

      // 5. Store training profile (best-effort — used for generation resume on reload)
      await upsertTrainingProfileToDb(userId, profile).catch(() => {});

      // 6. No session yet (email confirmation required) → show check-inbox screen
      if (!sessionAccessToken) {
        setEmailConfirmPending(true);
        setGenerating(false);
        return;
      }

      // 7. Session available → enter the app immediately
      //    activeProgramId is null for now; dashboard will set it when generation completes
      const user = {
        id: userId,
        name: name.trim(),
        goal: primaryGoal,
        experienceLevel,
        activeProgramId: undefined,
        onboardedAt: new Date().toISOString(),
        theme: 'dark' as const,
      };

      setUser(user);
      resetProgramCursors('');
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_THEME', payload: 'dark' });

      // Migrate any guest workout data to Supabase (fire-and-forget)
      migrateGuestData(userId);

      navigate('/');
    } finally {
      setGenerating(false);
    }
  }

  // ─── Email confirmation pending screen ──────────────────────────────────────

  if (emailConfirmPending) {
    return (
      <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-12 items-center justify-center">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto">
            <Mail size={36} className="text-brand-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              We sent a confirmation link to{' '}
              <span className="text-slate-200 font-medium">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <p className="mt-2 text-brand-400/80 text-xs">
              Your training program will be waiting for you when you log in.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-4 text-left space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Didn't get it?</p>
            <p className="text-slate-400 text-sm">Check your spam folder, or resend the email.</p>
            {resendSuccess && (
              <p className="text-green-400 text-sm font-medium">Email resent! Check your inbox.</p>
            )}
            <Button
              variant="ghost"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="w-full mt-1 text-slate-300 border border-slate-700"
            >
              <RefreshCw size={15} className={resendLoading ? 'animate-spin' : ''} />
              {resendLoading ? 'Sending…' : 'Resend confirmation email'}
            </Button>
          </div>

          <button
            type="button"
            onClick={handleGoToSignIn}
            className="text-sm text-brand-400 hover:text-brand-300 font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ─── Normal onboarding steps ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-8 overflow-y-auto">
      {repairMode && (
        <div className="mb-4 space-y-3">
          <p className="rounded-lg bg-amber-900/30 border border-amber-700/40 px-4 py-2 text-xs text-amber-300 text-center">
            Your account exists — just finish setting up your profile.
          </p>
          <Button variant="ghost" onClick={handleGoToSignIn} className="w-full text-slate-300 border border-slate-700">
            Back to sign in
          </Button>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={[
              'h-2 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-brand-500' : i < step ? 'w-2 bg-brand-400' : 'w-2 bg-slate-700',
            ].join(' ')}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">

        {/* Step 0 — Account */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Create account</h1>
              <p className="mt-2 text-slate-400">Sign up to sync your data across all devices.</p>
            </div>
            {submitError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={emailError}
              autoFocus
              autoComplete="email"
              onKeyDown={e => e.key === 'Enter' && nextFromAccount()}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={passwordError}
                autoComplete="new-password"
                onKeyDown={e => e.key === 'Enter' && nextFromAccount()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={handleGoToSignIn} className="text-brand-400 hover:text-brand-300 font-medium">
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">What's your name?</h1>
              <p className="mt-2 text-slate-400">This is how Omnexus will greet you.</p>
            </div>
            <Input
              label="Your name"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              error={nameError}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && nextFromName()}
              className="text-lg py-3"
            />
          </div>
        )}

        {/* Step 2 — AI Chat */}
        {step === 2 && (
          <OnboardingChat userName={name} onComplete={handleProfileComplete} />
        )}

        {/* Step 3 — Profile summary */}
        {step === 3 && profile && (
          <>
            <ProfileSummaryCard
              profile={profile}
              onGenerate={handleGenerate}
              generating={generating}
              generatingIdx={generatingIdx}
              error={generateError}
            />
            {submitError && (
              <p className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
            {generating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 size={15} className="animate-spin" />
                Setting up your account…
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation — steps 0 and 1 only */}
      {step < 2 && (
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={back} className="text-slate-300">
              <ArrowLeft size={18} />
              Back
            </Button>
          )}
          <Button onClick={step === 0 ? nextFromAccount : nextFromName} fullWidth size="lg">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
