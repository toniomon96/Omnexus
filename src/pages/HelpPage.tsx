import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronDown, ChevronUp, Bug, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiBase } from '../lib/api';

async function getCurrentAccessToken() {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── FAQ content — edit freely ─────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How do I start my first workout?',
    a: "Go to the Train tab, then tap \"Today's Workout\" if you have a program, or \"Quick Log\" to freestyle. You can also browse Programs to set up a structured 8-week plan.",
  },
  {
    q: 'How does Ask Omnexus work?',
    a: 'Ask Omnexus is an AI coach powered by Claude AI. It answers fitness and nutrition questions with citations from peer-reviewed research. Free users get 5 questions per day; Premium users get unlimited.',
  },
  {
    q: 'What is a personal record (PR)?',
    a: "PRs are automatically detected when you lift more weight for the same reps on an exercise. You'll get a confetti celebration and the PR is saved to your history.",
  },
  {
    q: 'How do I upgrade to Premium?',
    a: 'Go to Me → Subscription. Premium unlocks unlimited AI questions, unlimited program generation, and detailed weekly insights.',
  },
  {
    q: 'How do I export my data?',
    a: 'Go to Me → scroll down to the Danger Zone section. Tap "Export My Data" to download your full workout history and profile as a JSON file.',
  },
  {
    q: 'Can I use the app without creating an account?',
    a: 'Yes — most features work as a guest. Community features (Feed, Leaderboard, Challenges) require a free Omnexus account.',
  },
  {
    q: 'Is my health data private?',
    a: 'Yes. All data is encrypted in transit over HTTPS and stored in Supabase with Row Level Security — only you can access your data. We never sell your information.',
  },
  {
    q: "Why isn't my workout syncing across devices?",
    a: 'Make sure you are signed in with a Supabase account (not as a guest). Guest data is stored locally and does not sync. Create a free account to unlock cloud sync.',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function HelpPage() {
  const { session } = useAuth();
  const { toast } = useToast();

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bugForm, setBugForm] = useState({ description: '', steps: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleBugReport(e: React.FormEvent) {
    e.preventDefault();
    if (!bugForm.description.trim()) return;

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const accessToken = await getCurrentAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${apiBase}/api/report-bug`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bugForm),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
      toast('Bug report submitted — thank you!', 'success');
    } catch {
      toast('Failed to submit. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="Help & Support" showBack />
      <div className="px-4 pb-10 pt-4 space-y-6">

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <Card key={i} padding="sm">
                <button
                  className="w-full flex items-center justify-between gap-3 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i ? 'true' : 'false'}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white pr-2">
                    {faq.q}
                  </p>
                  {openFaq === i
                    ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
                    : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* ── Bug Report ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Report a Bug
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Found something broken? Let us know and we'll fix it fast.
          </p>

          {submitted ? (
            <Card className="text-center py-8">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Report received!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We'll investigate and fix it. Thanks for helping improve Omnexus.
              </p>
              <button
                className="mt-4 text-xs text-brand-500 font-medium"
                onClick={() => {
                  setSubmitted(false);
                  setBugForm({ description: '', steps: '', email: '' });
                }}
              >
                Submit another report
              </button>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handleBugReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    What went wrong? *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={bugForm.description}
                    onChange={e => setBugForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the bug as clearly as possible…"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Steps to reproduce <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={bugForm.steps}
                    onChange={e => setBugForm(f => ({ ...f, steps: e.target.value }))}
                    placeholder="1. Go to… 2. Tap… 3. See error…"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                {/* Only ask for email if the user is not signed in */}
                {!session && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Your email <span className="text-slate-400 font-normal">(optional — so we can follow up)</span>
                    </label>
                    <input
                      type="email"
                      value={bugForm.email}
                      onChange={e => setBugForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  <Bug size={16} />
                  {submitting ? 'Submitting…' : 'Submit Bug Report'}
                </Button>
              </form>
            </Card>
          )}
        </section>

        {/* ── Contact ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Contact Us
          </h2>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email Support</p>
                <a
                  href="mailto:support@omnexus.fit"
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  support@omnexus.fit
                </a>
              </div>
            </div>
          </Card>
        </section>

      </div>
    </AppShell>
  );
}
