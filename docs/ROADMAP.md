# Omnexus — Product Roadmap

---

## v1.0 — Shipped (Mobile Store Launch)

All 11 sprints complete. **0 TypeScript errors · 513 tests passing.**

| Sprint | Delivered |
|---|---|
| Foundation (1–8) | Branding, 5-tab nav, learning system, Vercel serverless, Claude Q&A, AI insights, PubMed feed, personalization, RPE, custom program builder, CI |
| Production | Supabase Auth (email+password), cloud sync, community (friends, leaderboard, challenges, real-time feed), GDPR (cookie consent, data export, account deletion) |
| AI Intelligence | Multi-turn onboarding agent, generative 8-week mesocycle engine, adaptation engine, block missions, AI challenges, peer insights |
| Semantic Learning | pgvector embeddings (OpenAI), semantic content search, dynamic micro-lesson generation |
| Security | Upstash rate limiting (20 req/10 min/IP), CORS production enforcement, prompt injection whitelist, Playwright E2E suite |
| Native | Capacitor v8 — iOS + Android, haptics, status bar, splash screen, safe areas |
| Sprint 4 | Nutrition tracking (macro logging, goals, date navigator, quick-add) |
| Sprint 5 | Source-grounded AI coach — pgvector RAG in `/api/ask`, citation display |
| Sprint 6 | Social/cooperative challenges — per-challenge leaderboard, team mode, friend invitations with Realtime |
| Sprint 7 | Wearables MVP (`src/lib/health.ts`, `HealthWidget`) — code ready, HealthKit deferred to v1.1 |
| Sprint 8 | Analytics — PostHog wrapper, 8 tracked events |
| Sprint 9 | Profile pictures (Supabase Storage), light mode polish (24 files), exercise YouTube demo embeds |
| Sprint 10 | Premium tier — Stripe checkout + webhooks + usage gating, SubscriptionPage |
| Sprint 11 | UX overhaul, TrainPage + CommunityPage hubs, HelpPage (FAQ + bug report), `/api/report-bug`, marketing landing page |
| Signup + Email | Custom `/api/signup` with Resend — branded confirmation emails, server-side admin user creation |
| Inline Workout Editing | Edit logged sets inline in history cards |
| Sprint A–J | Exercise Library to 316 exercises (11 categories), Exercise Detail Page redesign, Exercise Discovery Engine (5 modes + semantic search via pgvector), Gamification Engine (XP, ranks, streaks, achievements, celebrations), Learning System (15 courses, SM-2 spaced repetition, daily challenge), Omni AI Coach (Coach / Science / Check-In modes), Program Continuation (Progression Report, 3 paths, Training DNA), Course completion certificates + shareable share cards |
| V1 Polish (Sprints 1–5) | Sync state transparency, guest-to-account migration, Dashboard + Train clarity, post-workout reinforcement, AI quality + fallback states, launch-readiness accessibility sweep |
| Security Hardening | Cron endpoints fail-closed without CRON_SECRET, CORS strict-mode (403 on unknown origins), rate limiting in all environments, Content-Security-Policy on all API responses, Node 20 locked via .nvmrc + engines field, auth brute-force lockout, HSTS + security headers |

**Live:** https://fitness-app-ten-eta.vercel.app

---

## Sprint 5 Launch Readiness Snapshot (2026-03-12)

- Launch-critical UX copy and empty/degraded states were clarified across Dashboard, Train, Ask, Insights, and AI Program Generation.
- Accessibility hardening was applied to critical controls (focus-visible states, explicit input labeling, live-region status semantics).
- CI/release-gate policy is now explicit for `main`:
	- PR validation uses `verify:preview`
	- post-merge validation uses `verify:prod`
- Rollback ownership and incident handoff expectations are documented for release-day execution.
- Final QA signoff and accepted known issues are tracked in `docs/SPRINT_5_QA_CHECKLIST.md` and summarized in `docs/SPRINT_5_RELEASE_NOTES.md`.

---

## v1.x — Maintenance & Stabilization

These minor releases ship between now and the v2 cycle.

### v1.1 — Wearables (Full)
- Install `@capacitor-community/health` + `cap sync`
- Add HealthKit entitlement in Xcode (iOS) + Health Connect in AndroidManifest
- Submit app update to both stores

### v1.2 — PDF Export
- Export training program as formatted PDF
- Export workout history as PDF/CSV

### v1.3 — Advanced Program Progression
- Progressive overload automation — auto-suggest next session targets from adaptation results
- Week-by-week program view with planned vs. actual volume
- Deload week detection (auto-drop volume when 3 sessions show RPE ≥ 9)

### v1.4 — Beta Store Release Polish
- App Store and Play Store submission (requires Apple Developer + Google Play Console accounts)
- Store listing copy, screenshots, and preview videos
- Subscription flow QA on device (iOS IAP + Google Play Billing)
- TestFlight beta and Google Play internal test track setup

### v1.5 — Enhanced Learning
- Interactive exercise animations (Lottie or CSS)
- Video lesson integration
- Adaptive quiz difficulty based on past scores

---

## v2.0 — Product Depth

> Goal: Make Omnexus the best AI-powered fitness coaching app in the market.
> Focus: depth of AI, personalization, computer vision, offline resilience, and video content.

### 2.1 — AI Form Coach (Computer Vision)
- **MediaPipe Pose / MoveNet** — real-time pose estimation via device camera during sets
- Joint angle tracking (knee, hip, elbow, spine) compared to ideal rep profiles
- Cue cards rendered at end of each set ("chest didn't touch bar on 3 reps")
- Claude vision fallback — upload a clip for async analysis when on-device model underperforms
- Works fully offline on-device; clips never sent to server without user consent
- In-app video player component for playback with overlaid skeletal mesh

### 2.2 — Full Wearables Integration
- Enable HealthKit (iOS) and Health Connect (Android) — full permissions flow
- Pull heart rate, HRV, sleep score, active calories into daily dashboard
- Recovery score model: HRV trend + sleep quality → recommend rest vs. train
- Auto-populate logged sets with heart rate zone data from wearable
- HealthWidget expanded: 7-day sleep trend, resting HR history

### 2.3 — In-App Video Content
- Encrypted video hosting (Mux or Cloudflare Stream) for premium exercise demos
- Full-length tutorial courses (not just YouTube embeds) for premium subscribers
- Offline video download — cache lessons for gym use with no signal
- Adaptive bitrate streaming based on network quality

### 2.4 — Offline Sync & Conflict Resolution
- Full offline-first architecture — IndexedDB as local source of truth
- Background sync queue (service worker) — flushes to Supabase on reconnect
- Conflict resolution: last-write-wins with optional merge dialog for set data
- Offline indicators in UI; no spinner on network loss — content always visible
- PWA manifest + install prompt for web users

### 2.5 — Advanced AI Personalization
- Longitudinal training adaptation: Claude analyzes 12+ weeks of history to detect plateaus
- Injury risk flag: flags exercises showing consistent RPE spikes or volume drops
- Fatigue periodization: auto-schedule deload weeks based on accumulated fatigue score
- Nutrition AI: analyze logged meals vs. training load → macro target adjustments
- Sleep quality impact analysis on workout performance correlation

---

## v3.0 — B2B Gym Licensing

> Goal: License Omnexus to small and mid-size gyms ("mom and pop") as a white-label platform.
> Model: Per-seat SaaS subscription + optional white-label branding fee.

### 3.1 — Multi-Tenancy Architecture
- Gym as tenant: every table gets a `gym_id` column with Row Level Security
- Gym admin role: manage members, view aggregate analytics, create gym-specific programs
- Member onboarding flow: join via gym invite code or QR scan
- Supabase: one project per major gym (isolation) OR shared project with tenant partitioning
- Vercel: per-gym deployment with custom subdomain (`crossfitwest.omnexus.app`)

### 3.2 — White-Label & Custom Branding
- Gym uploads logo, sets primary/accent colors in admin dashboard
- App name configurable per tenant (shows gym's name, not "Omnexus")
- Branded email templates (confirmation, weekly digest) via Resend
- Custom domain support for web app (`app.crossfitwest.com`)
- App Store / Play Store: build script generates branded Capacitor app per gym

### 3.3 — Gym Admin Dashboard
- Web-only admin portal (`/admin`) — not in the mobile nav
- Member roster: view all members, subscription status, last active date
- Aggregate analytics: average workout frequency, most popular exercises, drop-off points
- Program management: create gym-specific programs visible only to members
- Challenge management: create gym-wide challenges with custom prizes/badges
- Bulk invite: upload CSV of member emails → Resend invite flow

### 3.4 — B2B Pricing & Billing
- Per-seat licensing: $X/member/month (volume discounts at 50, 100, 250+ seats)
- Annual plans with prepay discount
- Stripe Billing: usage-based seat counting (metered billing on member activations)
- Gym admin self-service: upgrade/downgrade seats, view invoices, cancel
- Free 30-day trial for gyms (no credit card required)
- Revenue share: partner gyms who refer other gyms get 10% MRR credit

### 3.5 — Trainer Tools
- Coach accounts: trainer role sees assigned clients' workouts in real time
- Program assignment: trainer pushes a specific program to a specific member
- Session annotation: trainer leaves comments on logged sets ("great depth, add 5lb next time")
- Client progress reports: auto-generated weekly PDF digest for each client
- Video review: client uploads form clip, trainer responds with annotated video

### 3.6 — Gym Content & Community
- Gym-scoped community feed (not shared with the global feed)
- Gym challenges visible only to members of that gym
- Gym-specific PubMed article curation (trainer pins articles to gym content library)
- Leaderboard scoped to gym members only

---

> Engineering standards, branching model, commit conventions, and release process are documented in `docs/RELEASE_STRATEGY.md` and `docs/SDLC_EXECUTION_PLAYBOOK.md`.
