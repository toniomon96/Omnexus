import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { ensureProfileUser } from '../lib/profileRecovery';
import { useApp } from '../store/AppContext';
import { setUser } from '../utils/localStorage';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

async function signInWithEmailPassword(email: string, password: string) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.signInWithPassword({ email, password });
}

async function resendConfirmationEmail(email: string) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

async function sendPasswordReset(email: string) {
  const { supabase } = await import('../lib/supabase');
  const response = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });

  // Some environments (preview domains, localhost variants) may not be in
  // Supabase's allowlist. Retry without a custom redirect so delivery still works.
  if (response.error) {
    const message = response.error.message.toLowerCase();
    if (message.includes('redirect') || message.includes('allow')) {
      return supabase.auth.resetPasswordForEmail(email);
    }
  }

  return response;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email not confirmed flow
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUnconfirmedEmail('');
    setResendSuccess(false);
    setLoading(true);

    try {
      const { data, error: signInError } = await signInWithEmailPassword(email, password);

      if (signInError) {
        // Detect "email not confirmed" — offer to resend the confirmation link
        const msg = signInError.message.toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          setUnconfirmedEmail(email);
        }
        setError(signInError.message);
        return;
      }

      if (!data.user) {
        setError('Sign in failed. Please try again.');
        return;
      }

      // Fetch profile from Supabase to hydrate local state
      const user = await ensureProfileUser(data.session);

      if (!user) {
        // Profile missing — redirect to onboarding to complete setup
        navigate('/onboarding', { replace: true });
        return;
      }

      setUser(user);
      dispatch({ type: 'SET_USER', payload: user });
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendConfirmationEmail(unconfirmedEmail);
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  }

  async function handleForgotPassword(e: React.SyntheticEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const { error: resetError } = await sendPasswordReset(forgotEmail);
      if (resetError) {
        setForgotError(resetError.message);
      } else {
        setForgotSuccess(true);
      }
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-12">
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4">
          <LogIn size={26} className="text-brand-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-slate-400 text-sm">Sign in to your Omnexus account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm w-full mx-auto">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
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

        <div className="text-right">
          <button
            type="button"
            onClick={() => { setShowForgot((v) => !v); setForgotError(''); setForgotSuccess(false); }}
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            Forgot password?
          </button>
        </div>

        {showForgot && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            {forgotSuccess ? (
              <div className="space-y-1.5 rounded-lg border border-green-800/60 bg-green-900/20 px-3 py-2.5">
                <p className="text-sm font-medium text-green-300">
                  Password reset link sent.
                </p>
                <p className="text-xs text-slate-300">
                  If you do not see it within a few minutes, check Spam or Junk and verify you entered the correct email.
                </p>
                <button
                  type="button"
                  onClick={(e) => void handleForgotPassword(e)}
                  disabled={forgotLoading || !forgotEmail}
                  className="mt-1 text-xs font-medium text-brand-300 hover:text-brand-200 disabled:opacity-60"
                >
                  {forgotLoading ? 'Resending...' : 'Resend reset email'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Your email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {forgotError && (
                  <p className="text-sm text-red-400">{forgotError}</p>
                )}
                <Button
                  type="button"
                  fullWidth
                  disabled={forgotLoading || !forgotEmail}
                  onClick={(e) => void handleForgotPassword(e)}
                >
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-400 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2">
              {error}
            </p>
            {/* Email not confirmed — offer to resend */}
            {unconfirmedEmail && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-3 space-y-1.5">
                <p className="text-xs text-slate-400">Haven't confirmed your email yet?</p>
                {resendSuccess ? (
                  <p className="text-xs text-green-400 font-medium">Confirmation email resent — check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={resendLoading ? 'animate-spin' : ''} />
                    {resendLoading ? 'Sending…' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-slate-400 mt-4">
          Don't have an account?{' '}
          <Link
            to="/onboarding"
            className="text-brand-400 hover:text-brand-300 font-medium"
          >
            Create one
          </Link>
        </p>

        <div className="relative flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs text-slate-400 dark:text-slate-600">or</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <Link
          to="/guest"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Try without an account
        </Link>
      </form>
    </div>
  );
}
