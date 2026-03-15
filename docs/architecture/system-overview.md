# System Overview

## What Omnexus Is

Omnexus is a mobile-first fitness platform that combines workout programming, workout logging, education, AI coaching, research discovery, and lightweight social features in a single product. It runs as a React 19 web app, ships as Capacitor-based iOS and Android apps, and uses Vercel serverless functions plus Supabase for backend services.

## Problems It Solves

- Reduces fragmentation between programming, logging, learning, and coaching tools.
- Gives users personalized guidance without requiring a human coach for every interaction.
- Supports both low-friction guest usage and full account-based cloud sync.
- Connects daily actions to longer-term progress through streaks, XP, insights, and progression reports.

## Product Principles

1. **Mobile-first clarity** — the app is optimized for daily use during and around workouts.
2. **AI as an assistant, not the only path** — core flows have deterministic or manual fallbacks.
3. **Guest-to-account continuity** — users can start immediately and migrate later.
4. **Evidence-oriented guidance** — research feed, citations, and learning content reinforce trust.
5. **Operational pragmatism** — serverless routes, Supabase, and typed helpers keep the stack compact.

## Runtime Surfaces

| Surface | Purpose | Main Paths |
|---|---|---|
| Web / PWA app | Primary UI for training, learning, social, and billing | `src/`, `public/` |
| Native wrappers | iOS and Android packaging around the same React app | `ios/`, `android/`, `capacitor.config.ts` |
| Serverless API | AI routes, billing, notifications, GDPR flows, content proxying | `api/` |
| Database and auth | User accounts, training data, social data, embeddings, subscriptions | Supabase via `src/lib/db.ts` and API routes |
| Documentation | Product, engineering, roadmap, audit, and historical context | `docs/` |

## High-Level System Model

```text
React app (web / Capacitor)
    ↓
Context state + hooks + localStorage + typed helpers
    ↓
/api/* Vercel functions for AI, billing, notifications, auth utilities
    ↓
Supabase (Auth, Postgres, Realtime, Storage, pgvector)
    ↓
External providers: Anthropic, OpenAI, Stripe, Resend, Upstash, PubMed
```

## Core Product Domains

- **Training**: onboarding, program generation, active workouts, workout history, progression.
- **Knowledge**: learning courses, quizzes, spaced repetition, recommendations, PubMed feed.
- **Coaching**: Ask Omnexus, workout adaptation, pre-workout briefings, insights.
- **Engagement**: gamification, community, challenges, notifications, subscriptions.
- **Operations**: auth recovery, billing, release process, environment management, security controls.
