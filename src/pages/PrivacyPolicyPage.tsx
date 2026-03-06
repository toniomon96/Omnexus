import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Omnexus ("we", "our", or "us") is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, store, and share information
              when you use the Omnexus fitness application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><span className="text-slate-300">Account information</span> — email address, display name, fitness goal, and experience level provided during sign-up.</li>
              <li><span className="text-slate-300">Workout data</span> — sessions, exercises, sets, weights, reps, and personal records you log in the app.</li>
              <li><span className="text-slate-300">Learning progress</span> — completed lessons, modules, courses, and quiz scores.</li>
              <li><span className="text-slate-300">Custom programs</span> — training programs you build using the program builder.</li>
              <li><span className="text-slate-300">Community data</span> — friend connections, challenge participation, and activity feed items you opt in to share.</li>
              <li><span className="text-slate-300">Subscription data</span> — your plan tier and billing period (managed by Stripe; card details are never stored by Omnexus).</li>
              <li><span className="text-slate-300">Technical data</span> — browser type, device type, and basic usage analytics to improve the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>To provide and personalise the Omnexus app experience.</li>
              <li>To sync your data across devices via our cloud storage provider (Supabase).</li>
              <li>To power community features such as friends, leaderboards, and challenges.</li>
              <li>To generate AI-powered insights and coaching suggestions using the Anthropic Claude API.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Cookies &amp; Local Storage</h2>
            <p>
              We use browser local storage to keep you signed in, cache your active workout session,
              and remember your preferences (e.g. theme). We do not use third-party advertising cookies.
              You can decline non-essential storage via the cookie consent banner. Essential session
              storage required to keep you logged in cannot be disabled while you use the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Data Sharing</h2>
            <p className="mb-2">
              We do not sell your personal data. We share data only with the following service providers
              who process it on our behalf:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><span className="text-slate-300">Supabase</span> — database, authentication, and file storage (EU data residency available).</li>
              <li><span className="text-slate-300">Vercel</span> — hosting and serverless functions.</li>
              <li><span className="text-slate-300">Anthropic</span> — AI responses for the Ask Omnexus and Insights features (prompts do not include your full workout history).</li>
              <li><span className="text-slate-300">Stripe</span> — payment processing for Premium subscriptions. Omnexus never stores your card details; all payment data is handled by Stripe.</li>
              <li><span className="text-slate-300">PostHog</span> — anonymous product analytics (e.g. feature usage counts). No personally identifiable information is sent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account,
              all personal data including workout history, personal records, learning progress,
              and community data is permanently erased within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Your Rights (GDPR)</h2>
            <p className="mb-2">If you are located in the EEA or UK, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><span className="text-slate-300">Access</span> — download all your data via the "Export My Data" option in your profile.</li>
              <li><span className="text-slate-300">Erasure</span> — delete your account and all associated data from the danger zone in your profile.</li>
              <li><span className="text-slate-300">Rectification</span> — update your name, goal, and experience level in your profile at any time.</li>
              <li><span className="text-slate-300">Portability</span> — your export is a standard JSON file you can use with other services.</li>
              <li><span className="text-slate-300">Objection</span> — contact us to object to any specific processing activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Security</h2>
            <p>
              All data is transmitted over HTTPS. Passwords are never stored by us — authentication
              is handled by Supabase Auth using industry-standard bcrypt hashing. Row-level security
              policies ensure users can only access their own data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes
              by updating the "last updated" date at the top of this page and, where appropriate,
              sending an email notification.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Contact</h2>
            <p>
              For any privacy-related questions or requests, please contact us at{' '}
              <span className="text-brand-400">privacy@omnexus.fit</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
