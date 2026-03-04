/**
 * LandingPage — Omnexus marketing website
 *
 * Lives at /landing. To make it the root URL for unauthenticated visitors,
 * update GuestOrAuthGuard in router.tsx so that a no-session / no-guest
 * visitor is rendered <LandingPage /> instead of <Navigate to="/login" />.
 *
 * Customize:
 *   - APP_URL        → your Vercel deployment URL
 *   - COPY sections  → all text is inline and clearly labeled
 *   - Colors         → uses brand-* and slate-* Tailwind vars to match the app
 *   - Screenshots    → replace placeholder divs with <img> tags pointing to real screenshots
 */

import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Dumbbell,
  Trophy,
  BookOpen,
  BarChart2,
  Users,
  Sparkles,
  Star,
  Check,
  ArrowRight,
  Zap,
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* CUSTOMIZE: replace with your actual logo */}
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <Dumbbell size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Omnexus</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-300 hover:text-white transition-colors font-medium"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-sm bg-brand-500 hover:bg-brand-400 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            Get started free
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Gradient background glow */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-400 mb-8">
          <Sparkles size={12} />
          {/* COPY: eyebrow label */}
          AI-powered fitness coaching
        </div>

        {/* Headline — COPY: main value proposition */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
          Train smarter.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
            Not just harder.
          </span>
        </h1>

        {/* Sub-headline — COPY */}
        <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
          Omnexus builds your personalized 8-week training program, coaches you through every
          workout, and explains the science behind your progress — all in one app.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            Start for free
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/guest')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl text-base font-medium transition-colors"
          >
            Try as guest
          </button>
        </div>

        {/* Trust line */}
        <p className="mt-6 text-xs text-slate-500">
          Free forever · No credit card required · Cancel Premium anytime
        </p>
      </div>

      {/* CUSTOMIZE: App screenshot / mockup placeholder */}
      <div className="relative z-10 mt-16 w-full max-w-sm mx-auto">
        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-slate-900 aspect-[9/19]">
          {/* Replace this div with an <img src="/screenshots/dashboard.png" ... /> */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600">
            <Dumbbell size={36} />
            <p className="text-xs">App screenshot here</p>
          </div>
        </div>
        {/* Glow underneath screenshot */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-brand-500/30 blur-2xl rounded-full" />
      </div>
    </section>
  );
}

function SocialProofBar() {
  // COPY: Update numbers as the app grows
  const stats = [
    { value: '51',   label: 'Exercises tracked'     },
    { value: 'AI',   label: 'Science-backed coaching' },
    { value: '8wk',  label: 'Personalized programs'  },
    { value: '100%', label: 'Data privacy'            },
  ];
  return (
    <section className="bg-slate-900 border-y border-white/5 py-10">
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="text-3xl font-extrabold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  // COPY: Problem/solution section
  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Most fitness apps just track what you do.
        </h2>
        <p className="text-lg text-slate-400 leading-relaxed mb-8">
          They count reps. They log sets. But they never tell you{' '}
          <em className="text-white not-italic font-semibold">why</em> it works, what to do next,
          or how to adapt when life gets in the way.
        </p>
        <div className="relative inline-block">
          <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
            Omnexus is different. It coaches you.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      color: 'bg-brand-500/10 text-brand-400',
      // COPY: Feature name + description
      title: 'AI Coach — Ask anything',
      description:
        'Ask Omnexus any fitness or nutrition question and get science-backed answers with citations from peer-reviewed research. Powered by Claude AI.',
    },
    {
      icon: Dumbbell,
      color: 'bg-blue-500/10 text-blue-400',
      title: 'Smart Workout Logger',
      description:
        'Log sets with weight, reps, and RPE. Personal records are auto-detected — and celebrated with confetti. Your progress is always visible.',
    },
    {
      icon: BarChart2,
      color: 'bg-violet-500/10 text-violet-400',
      title: 'Weekly AI Insights',
      description:
        'After each week of training, Omnexus analyses your volume, intensity, and recovery to give you a personalized coaching report.',
    },
    {
      icon: BookOpen,
      color: 'bg-green-500/10 text-green-400',
      title: 'Learning Hub',
      description:
        'Structured courses on strength, nutrition, recovery, and sleep — with quizzes. Learn the science so you can train with confidence.',
    },
    {
      icon: Users,
      color: 'bg-yellow-500/10 text-yellow-400',
      title: 'Community & Challenges',
      description:
        'Compete on weekly leaderboards, join team challenges with friends, and share your workouts. Train alongside people who get it.',
    },
    {
      icon: Zap,
      color: 'bg-orange-500/10 text-orange-400',
      title: 'Your Program, Personalized',
      description:
        "Answer a few questions and the AI builds a complete 8-week periodized program matched to your goals, experience, and schedule.",
    },
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          {/* COPY: Section heading */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built around evidence-based exercise science and real AI — not gimmicks.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      // COPY: How it works steps
      title: 'Tell us about yourself',
      description:
        'A quick AI-powered conversation collects your goals, experience level, available equipment, and schedule. No forms — just a chat.',
    },
    {
      number: '02',
      title: 'Get your personalized program',
      description:
        "Omnexus builds a science-based 8-week program with proper periodization — accumulation, intensification, and deload phases — tailored to you.",
    },
    {
      number: '03',
      title: 'Train, track, and improve',
      description:
        'Log each workout, watch your PRs climb, ask the AI coach questions, and receive weekly insights that adapt your training as you progress.',
    },
  ];

  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-slate-400 text-lg">Up and running in under 5 minutes.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="text-xl font-extrabold text-brand-400">{number}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const navigate = useNavigate();

  // COPY: Pricing tiers — update prices to match your Stripe setup
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Everything you need to get started.',
      cta: 'Get started free',
      ctaAction: () => navigate('/onboarding'),
      highlight: false,
      features: [
        '5 AI questions per day',
        '1 AI program per day',
        'Full workout logger',
        'Exercise library (51 exercises)',
        'Personal records tracking',
        'Learning Hub (courses + quizzes)',
        'Community access',
        'Data export & delete',
      ],
    },
    {
      name: 'Premium',
      // COPY: Update your actual monthly price here
      price: '$9.99',
      period: '/ month',
      description: 'For serious athletes who want more AI.',
      cta: 'Start Premium',
      ctaAction: () => navigate('/subscription'),
      highlight: true,
      features: [
        'Unlimited AI questions',
        'Unlimited AI program generation',
        'Weekly AI coaching reports',
        'Priority AI responses',
        'Everything in Free',
      ],
    },
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-slate-400 text-lg">
            Free forever for core features. Upgrade when you're ready for more AI.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {tiers.map(({ name, price, period, description, cta, ctaAction, highlight, features }) => (
            <div
              key={name}
              className={[
                'rounded-2xl p-6 border flex flex-col',
                highlight
                  ? 'bg-brand-500/5 border-brand-500/40 relative overflow-hidden'
                  : 'bg-slate-800/50 border-white/5',
              ].join(' ')}
            >
              {highlight && (
                <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                  MOST POPULAR
                </div>
              )}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">{price}</span>
                {period && <span className="text-slate-400 mb-1 text-sm">{period}</span>}
              </div>
              <p className="text-sm text-slate-400 mb-6">{description}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={15} className="text-brand-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={ctaAction}
                className={[
                  'w-full py-3 rounded-xl text-sm font-semibold transition-all',
                  highlight
                    ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
                ].join(' ')}
              >
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  // COPY: Replace with real testimonials when available
  const testimonials = [
    {
      quote: "The AI coach actually explains why I'm doing each exercise. No other app does that.",
      name: 'Alex M.',
      role: 'Intermediate lifter, 2 years training',
      stars: 5,
    },
    {
      quote: "I've tried 6 fitness apps. Omnexus is the only one that adapted to my schedule and injuries.",
      name: 'Jordan K.',
      role: 'Beginner, 6 months in',
      stars: 5,
    },
    {
      quote: "The weekly AI insights caught that I was overtraining before I even noticed. Genuinely useful.",
      name: 'Sam R.',
      role: 'Powerlifter, 4 years training',
      stars: 5,
    },
  ];

  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14">
          What athletes are saying
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, stars }) => (
            <div
              key={name}
              className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-5">"{quote}"</p>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </div>
            </div>
          ))}
        </div>
        {/* COPY: Placeholder note — remove when you have real testimonials */}
        <p className="text-center text-xs text-slate-600 mt-8">
          * Placeholder testimonials — replace with real reviews from your early users.
        </p>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  // COPY: Landing page FAQ — different from in-app Help FAQ
  const faqs = [
    {
      q: "Is Omnexus really free?",
      a: "Yes — the core app is free forever. You get 5 AI questions per day, full workout logging, the exercise library, and community access at no cost. Premium unlocks unlimited AI.",
    },
    {
      q: "Do I need any equipment?",
      a: "No. During onboarding you tell us what equipment you have — from a full commercial gym to bodyweight only — and the AI builds your program accordingly.",
    },
    {
      q: "How is this different from a regular personal trainer?",
      a: "Omnexus is available 24/7 and costs a fraction of a PT. It can't watch your form in person, but it gives you science-backed programming, answers questions instantly, and adapts your plan over time.",
    },
    {
      q: "Is my data safe?",
      a: "Absolutely. Data is stored with Supabase's Row Level Security — only you can access your data. We never sell or share personal information. You can export or delete all your data at any time.",
    },
    {
      q: "Can I cancel Premium?",
      a: "Yes, anytime. Go to Me → Subscription → Manage. You'll keep Premium features until the end of your billing period.",
    },
  ];

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-white/5 rounded-2xl bg-slate-800/40 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                <span className="text-slate-400 shrink-0 text-lg leading-none">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-slate-950 py-24 px-6 text-center">
      <div className="max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
          <Dumbbell size={28} className="text-brand-400" strokeWidth={1.8} />
        </div>
        {/* COPY: Final CTA headline */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to train smarter?
        </h2>
        <p className="text-lg text-slate-400 mb-10">
          Free forever. Your first workout is three taps away.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 mx-auto"
        >
          Get started — it's free
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-white/5 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
            <Dumbbell size={12} className="text-white" strokeWidth={2.5} />
          </div>
          {/* COPY: Footer tagline */}
          <span className="text-slate-400 font-medium">Omnexus</span>
          <span>· Train smarter, not just harder.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="mailto:support@omnexus.app" className="hover:text-white transition-colors">
            Contact
          </a>
          <a href="/help" className="hover:text-white transition-colors">Help</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

import { useState } from 'react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
