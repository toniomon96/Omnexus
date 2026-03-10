import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

async function updateUserPassword(password: string) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.updateUser({ password });
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await updateUserPassword(password);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-12">
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4">
          <KeyRound size={26} className="text-brand-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Set new password</h1>
        <p className="mt-2 text-slate-400 text-sm">Choose a strong password for your account</p>
      </div>

      {success ? (
        <div className="max-w-sm w-full mx-auto text-center space-y-3 mt-4">
          <p className="text-green-400 font-semibold text-lg">Password updated!</p>
          <p className="text-slate-400 text-sm">Taking you to the app…</p>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500 mx-auto mt-4" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto">
          <div className="relative">
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && (
            <p className="text-sm text-red-400 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading || !password || !confirm}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Remembered your password?{' '}
            <a href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
