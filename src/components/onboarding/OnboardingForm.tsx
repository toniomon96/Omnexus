import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import type { UserTrainingProfile, Program, ExperienceLevel } from '../../types';
import { OnboardingChat } from './OnboardingChat';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { setUser, resetProgramCursors, saveCustomProgram } from '../../utils/localStorage';
import { apiBase } from '../../lib/api';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { upsertTrainingProfile, upsertCustomProgram } from '../../lib/db';

// Step 0: Account, Step 1: Name, Step 2: AI Chat, Step 3: Profile summary + generate
const STEPS = ['Account', 'Name', 'Discover', 'Your Plan'];

export function OnboardingForm() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { session } = useAuth();

  // Repair mode: user already has a Supabase auth account but is missing a
  // profiles row (e.g. profile creation failed during a previous signup, or the
  // account was deleted and recreated). Skip step 0 — no new signup needed.
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
  const [loading, setLoading] = useState(false);

  // Email confirmation pending — shown instead of normal steps
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Sign out any existing session before navigating to /login.
  // Without this, LoginGuard sees the session and redirects back to / →
  // GuestOrAuthGuard can't find a profile → /onboarding → infinite loop.
  async function handleGoToSignIn() {
    await supabase.auth.signOut();
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
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  }

  async function handleProgramReady(program: Program) {
    if (!profile) return;
    setSubmitError('');
    setLoading(true);

    try {
      let userId: string;
      let sessionAccessToken: string | null = null;

      if (repairMode && session) {
        // Repair mode: reuse the existing auth account — skip signUp entirely.
        userId = session.user.id;
        sessionAccessToken = session.access_token;
      } else {
        // 1. Create Supabase account (emailRedirectTo ensures confirmation link lands on our callback page)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

        if (signUpError) {
          const msg = signUpError.message ?? '';
          const isExisting = /already registered|already exists|email.*taken/i.test(msg);
          const errMsg = isExisting
            ? 'An account with this email already exists. Please sign in instead.'
            : msg || 'Account creation failed. Please try again.';
          console.error('[OnboardingForm] signUp error:', signUpError);
          setSubmitError(errMsg);
          setStep(0);
          return;
        }
        // When email confirmation is ON and the email already exists, Supabase returns
        // a fake/obfuscated user (no error, but ID won't exist in auth.users).
        // data.session will also be null in this case — we detect it below.
        if (!data.user) {
          console.error('[OnboardingForm] signUp returned no user and no error — likely duplicate email with confirmation ON');
          setSubmitError('Account creation failed. Please try again.');
          setStep(0);
          return;
        }

        userId = data.user.id;
        sessionAccessToken = data.session?.access_token ?? null;
      }

      // 2. Map the AI profile goal to a single Goal for the legacy User interface
      const primaryGoal = (profile.goals[0] ?? 'general-fitness') as 'hypertrophy' | 'fat-loss' | 'general-fitness';
      const experienceLevel: ExperienceLevel = profile.trainingAgeYears === 0
        ? 'beginner'
        : profile.trainingAgeYears <= 2
          ? 'intermediate'
          : 'advanced';

      // 3. Save AI-generated program locally first (works regardless of email confirmation status)
      const programId = crypto.randomUUID();
      const programWithMeta: Program = {
        ...program,
        id: programId,
        isCustom: true,
        isAiGenerated: true,
        createdAt: new Date().toISOString(),
      };
      saveCustomProgram(programWithMeta);
      // Best-effort DB sync — will fail if email confirmation is pending (no session yet).
      // The dataMigration will sync it on first login.
      upsertCustomProgram(programWithMeta, userId).catch(() => { /* synced later */ });

      // 4. Server-side profile setup
      // Pass the Bearer token when available (email confirmation OFF or repair mode);
      // setup-profile falls back to admin user verification when no session exists (email confirmation ON).
      const profileHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionAccessToken) {
        profileHeaders['Authorization'] = `Bearer ${sessionAccessToken}`;
      }
      const profileRes = await fetch(`${apiBase}/api/setup-profile`, {
        method: 'POST',
        headers: profileHeaders,
        body: JSON.stringify({
          userId,
          name: name.trim(),
          goal: primaryGoal,
          experienceLevel,
          activeProgramId: programId,
        }),
      });

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({})) as { error?: string };
        // Don't sign out in repair mode — the user is already signed in.
        if (!repairMode) await supabase.auth.signOut();
        // A 401 "User not found" means the email was already registered and Supabase
        // returned a fake user ID (email confirmation is ON). Direct the user to sign in.
        const serverErr = body.error ?? '';
        const profileErrMsg = profileRes.status === 401
          ? 'An account with this email already exists. Please sign in instead.'
          : serverErr || 'Profile setup failed. Please try again.';
        console.error('[OnboardingForm] setup-profile failed:', profileRes.status, body);
        setSubmitError(profileErrMsg);
        if (!repairMode) setStep(0);
        return;
      }

      // 5. Email confirmation is ON — no session yet. Show the check-inbox screen.
      // (Never triggered in repair mode since session already exists.)
      if (!sessionAccessToken) {
        setEmailConfirmPending(true);
        return;
      }

      // 6. Session available (email confirmation OFF). Save training profile + enter app.
      await upsertTrainingProfile(userId, profile).catch(() => {
        // Non-fatal — training_profiles table may not exist yet in development
      });

      const user = {
        id: userId,
        name: name.trim(),
        goal: primaryGoal,
        experienceLevel,
        activeProgramId: programId,
        onboardedAt: new Date().toISOString(),
        theme: 'dark' as const,
      };

      setUser(user);
      resetProgramCursors(programId);
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_THEME', payload: 'dark' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  // ─── Email confirmation pending screen ────────────────────────────────────────

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
              Click it to activate your account, then sign in here.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-4 py-4 text-left space-y-2">
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

  // ─── Normal onboarding steps ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-8 overflow-y-auto">
      {/* Repair mode banner */}
      {repairMode && (
        <p className="mb-4 rounded-lg bg-amber-900/30 border border-amber-700/40 px-4 py-2 text-xs text-amber-300 text-center">
          Your account exists — just finish setting up your profile.
        </p>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={[
              'h-2 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-brand-500' : i < step ? 'w-2 bg-brand-400' : 'w-2 bg-slate-300 dark:bg-slate-700',
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
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              autoFocus
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && nextFromAccount()}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === 'Enter' && nextFromAccount()}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="text-brand-400 hover:text-brand-300 font-medium"
              >
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
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && nextFromName()}
              className="text-lg py-3"
            />
          </div>
        )}

        {/* Step 2 — AI Chat */}
        {step === 2 && (
          <OnboardingChat userName={name} onComplete={handleProfileComplete} />
        )}

        {/* Step 3 — Profile summary + generate program */}
        {step === 3 && profile && (
          <>
            <ProfileSummaryCard
              profile={profile}
              onProgramReady={handleProgramReady}
            />
            {submitError && (
              <p className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
            {loading && (
              <p className="mt-3 text-sm text-slate-400 text-center">Creating your account…</p>
            )}
          </>
        )}
      </div>

      {/* Navigation — only shown on steps 0 and 1 */}
      {step < 2 && (
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={back} className="text-slate-300">
              <ArrowLeft size={18} />
              Back
            </Button>
          )}
          <Button
            onClick={step === 0 ? nextFromAccount : nextFromName}
            fullWidth
            size="lg"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
