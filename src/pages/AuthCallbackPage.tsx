import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHistory } from '../utils/localStorage';
import { upsertSession, upsertPersonalRecords } from '../lib/db';

type Status = 'loading' | 'confirmed' | 'recovery' | 'error';

/** Sync any guest workout history + PRs to Supabase after email confirmation. Fire-and-forget. */
function migrateGuestData(userId: string): void {
  const history = getHistory();
  if (history.sessions.length === 0 && history.personalRecords.length === 0) return;
  Promise.all([
    ...history.sessions.map(s => upsertSession(s, userId)),
    upsertPersonalRecords(history.personalRecords, userId),
  ]).catch(err => {
    console.warn('[AuthCallbackPage] Guest data migration failed:', err);
  });
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Supabase v2 automatically processes the URL hash (access_token / type params)
    // and fires onAuthStateChange. We listen and route accordingly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('recovery');
        // Brief confirmation message, then navigate to the reset form
        setTimeout(() => navigate('/reset-password', { replace: true }), 1200);
      } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        setStatus('confirmed');
        migrateGuestData(session.user.id);
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    });

    // Safety fallback — if no auth event fires within 6 seconds, try getSession()
    // This handles edge cases where the hash has already been consumed.
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('confirmed');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } else {
        setStatus('error');
      }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 items-center justify-center px-6">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
          <p className="text-slate-400">Verifying your account…</p>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle size={52} className="text-green-400" />
          <h1 className="text-2xl font-bold text-white">Email confirmed!</h1>
          <p className="text-slate-400">Your account is verified. Taking you to the app…</p>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500 mt-2" />
        </div>
      )}

      {status === 'recovery' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle size={52} className="text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Link verified</h1>
          <p className="text-slate-400">Loading password reset form…</p>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500 mt-2" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle size={52} className="text-red-400" />
          <h1 className="text-2xl font-bold text-white">Link expired or invalid</h1>
          <p className="text-slate-400 text-sm">
            This link may have already been used or has expired. Request a new one from the sign-in page.
          </p>
          <a
            href="/login"
            className="mt-2 inline-block rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Back to sign in
          </a>
        </div>
      )}
    </div>
  );
}
