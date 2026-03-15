import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'confirmed' | 'recovery' | 'error';

export function isRecoveryCallbackUrl(href: string): boolean {
  const url = new URL(href);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  return url.searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
}

/**
 * Fire-and-forget: upload any locally stored workout sessions and personal
 * records that were collected while the user was operating as a guest.
 * Silently swallowed on failure — local data is never deleted.
 */
export async function migrateGuestData(userId: string): Promise<void> {
  try {
    const { getHistory } = await import('../utils/localStorage');
    const { upsertSession, upsertPersonalRecords } = await import('../lib/db');
    const history = getHistory();

    // Upload sessions that are not yet in the cloud
    const unsynced = history.sessions.filter(
      (s) => !s.syncStatus || s.syncStatus === 'saved_on_device',
    );
    await Promise.all(unsynced.map((s) => upsertSession(s, userId).catch(() => undefined)));

    if (history.personalRecords.length > 0) {
      await upsertPersonalRecords(history.personalRecords, userId).catch(() => undefined);
    }
  } catch {
    // Migration is best-effort; never block sign-in on failure
  }
}

async function subscribeToAuthCallback(
  onEvent: (event: string, session: { user: { id: string } } | null) => void,
) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.onAuthStateChange(onEvent);
}

async function getAuthCallbackSession() {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.getSession();
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const isRecoveryLink = isRecoveryCallbackUrl(window.location.href);

    // Supabase v2 automatically processes the URL hash (access_token / type params)
    // and fires onAuthStateChange. We listen and route accordingly.
    let active = true;
    let unsubscribe = () => {};

    void subscribeToAuthCallback((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('recovery');
        // Brief confirmation message, then navigate to the reset form
        setTimeout(() => navigate('/reset-password', { replace: true }), 1200);
      } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        setStatus('confirmed');
        // Migrate any locally stored guest data before redirecting to the app
        void migrateGuestData(session.user.id);
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    }).then(({ data: { subscription } }) => {
      if (!active) {
        subscription.unsubscribe();
        return;
      }
      unsubscribe = () => {
        subscription.unsubscribe();
      };
    });

    // Safety fallback — if no auth event fires within 6 seconds, try getSession()
    // This handles edge cases where the hash has already been consumed.
    const timeout = setTimeout(async () => {
      const { data: { session } } = await getAuthCallbackSession();
      if (isRecoveryLink && session) {
        setStatus('recovery');
        setTimeout(() => navigate('/reset-password', { replace: true }), 500);
      } else if (session) {
        setStatus('confirmed');
        void migrateGuestData(session.user.id);
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } else {
        setStatus('error');
      }
    }, 6000);

    return () => {
      active = false;
      unsubscribe();
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
