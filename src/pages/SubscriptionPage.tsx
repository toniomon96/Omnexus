import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiBase } from '../lib/api';
import { Check, Zap, Loader2, Star } from 'lucide-react';

const FEATURES: { label: string; free: boolean; premium: boolean }[] = [
  { label: 'Workout tracking (unlimited)', free: true, premium: true },
  { label: 'Training programs', free: true, premium: true },
  { label: 'Exercise library', free: true, premium: true },
  { label: 'Learning courses', free: true, premium: true },
  { label: 'Community & challenges', free: true, premium: true },
  { label: 'AI Q&A (5 questions/day)', free: true, premium: false },
  { label: 'AI Q&A (unlimited)', free: false, premium: true },
  { label: 'AI program generation drafts (1/month)', free: true, premium: false },
  { label: 'AI program generation drafts (5/month)', free: false, premium: true },
  { label: 'Priority AI responses (2× detail)', free: false, premium: true },
];

export function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const successParam = searchParams.get('success');
  const checkoutSessionId = searchParams.get('session_id');

  const { session } = useAuth();
  const { status, loading, refresh } = useSubscription();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);
  const [verifyingCheckout, setVerifyingCheckout] = useState(false);
  const [checkoutVerified, setCheckoutVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const isPremium = status?.tier === 'premium';

  useEffect(() => {
    if (successParam !== 'true' || !session) return;
    const accessToken = session.access_token;
    if (isPremium) {
      setCheckoutVerified(true);
      setVerificationError(null);
      return;
    }

    let cancelled = false;

    async function verifyCheckout() {
      setVerifyingCheckout(true);
      setVerificationError(null);

      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const url = checkoutSessionId
            ? `${apiBase}/api/checkout-status?session_id=${encodeURIComponent(checkoutSessionId)}`
            : `${apiBase}/api/subscription-status`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json().catch(() => ({})) as { tier?: string; error?: string };

          if (cancelled) return;

          if (res.ok && data.tier === 'premium') {
            setCheckoutVerified(true);
            setVerificationError(null);
            refresh();
            setVerifyingCheckout(false);
            return;
          }
        } catch {
          if (cancelled) return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (!cancelled) {
        setVerificationError('Your payment succeeded, but Premium is still being finalized. Tap below to check again.');
        setVerifyingCheckout(false);
      }
    }

    void verifyCheckout();

    return () => {
      cancelled = true;
    };
  }, [successParam, checkoutSessionId, session, isPremium, refresh]);

  async function handleUpgrade() {
    if (!session) return;
    setUpgrading(true);
    try {
      const res = await fetch(`${apiBase}/api/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 409 && data.alreadyPremium) {
        refresh();
        toast('Premium is already active for this account.', 'success');
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      if (data.sessionUrl) window.location.href = data.sessionUrl;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start checkout', 'error');
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManage() {
    if (!session) return;
    setManaging(true);
    try {
      const res = await fetch(`${apiBase}/api/customer-portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Portal unavailable');
      if (data.portalUrl) window.location.href = data.portalUrl;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to open portal', 'error');
    } finally {
      setManaging(false);
    }
  }

  function handleCheckAgain() {
    setCheckoutVerified(false);
    setVerificationError(null);
    refresh();
  }

  const effectivePremium = isPremium || checkoutVerified;
  const showVerifiedSuccess = successParam === 'true' && effectivePremium;
  const blockUpgrade = verifyingCheckout || successParam === 'true';

  return (
    <AppShell>
      <TopBar title="Subscription" showBack />
      <div className="px-4 pb-8 mt-2 space-y-4">

        {/* Success banner */}
        {showVerifiedSuccess && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-4 flex items-center gap-3">
            <Star size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                Welcome to Premium!
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                Your subscription is now active. Enjoy unlimited AI features.
              </p>
            </div>
          </div>
        )}

        {/* Pending verification banner */}
        {successParam === 'true' && !showVerifiedSuccess && verifyingCheckout && (
          <div className="rounded-2xl bg-brand-500/10 border border-brand-500/30 p-4 flex items-center gap-3">
            <Loader2 size={20} className="text-brand-500 shrink-0 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Finalizing your Premium upgrade
              </p>
              <p className="text-xs text-brand-600/70 dark:text-brand-400/70">
                Your payment went through. We’re syncing your subscription now.
              </p>
            </div>
          </div>
        )}

        {/* Verification error */}
        {verificationError && !showVerifiedSuccess && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Premium activation pending
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                  {verificationError}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleCheckAgain}>
                Check again
              </Button>
            </div>
          </Card>
        )}

        {/* Current status */}
        {loading ? (
          <Card>
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading subscription…</span>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  Current Plan
                </p>
                <div className="flex items-center gap-2">
                  {effectivePremium ? (
                    <>
                      <Zap size={16} className="text-brand-500" fill="currentColor" />
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        Premium
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      Free
                    </span>
                  )}
                </div>
                {effectivePremium && status?.periodEnd && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {status.cancelAtPeriodEnd
                      ? `Cancels ${new Date(status.periodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(status.periodEnd).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              {effectivePremium && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleManage}
                  disabled={managing}
                >
                  {managing ? <Loader2 size={14} className="animate-spin" /> : 'Manage'}
                </Button>
              )}
            </div>

            {status && (
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span>
                  AI Q&A: <strong className="text-slate-700 dark:text-slate-300">
                    {status.askCount}/{status.askLimit}
                  </strong> today
                </span>
                <span>
                  AI drafts: <strong className="text-slate-700 dark:text-slate-300">
                    {status.programGenCount}/{status.programGenLimit}
                  </strong> this month
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Feature comparison */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Plan Comparison
          </h2>
          <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center text-brand-500">Premium</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {FEATURES.map((f) => (
              <div key={f.label} className="grid grid-cols-3 py-2 text-xs items-center">
                <span className="text-slate-600 dark:text-slate-400 pr-2">{f.label}</span>
                <span className="text-center">
                  {f.free ? (
                    <Check size={14} className="inline text-green-500" />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </span>
                <span className="text-center">
                  {f.premium ? (
                    <Check size={14} className="inline text-brand-500" />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Upgrade CTA */}
        {!effectivePremium && !blockUpgrade && (
          <Button
            fullWidth
            onClick={handleUpgrade}
            disabled={upgrading}
          >
            {upgrading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Redirecting to checkout…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap size={16} fill="currentColor" />
                Upgrade to Premium
              </span>
            )}
          </Button>
        )}

        {!effectivePremium && blockUpgrade && !showVerifiedSuccess && (
          <Button fullWidth variant="ghost" onClick={handleCheckAgain} disabled={verifyingCheckout} size="sm">
            {verifyingCheckout ? 'Checking subscription…' : 'Check Premium status again'}
          </Button>
        )}

        {effectivePremium && (
          <Button fullWidth variant="ghost" onClick={refresh} size="sm">
            Refresh status
          </Button>
        )}
      </div>
    </AppShell>
  );
}
