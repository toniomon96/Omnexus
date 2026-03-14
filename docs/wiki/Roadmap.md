# Product Roadmap

## v1.0 — Shipped ✅

All sprints complete. **0 TypeScript errors · 513 tests passing.**

Core deliverables: AI onboarding coach, 8-week program generator, workout logging, 316-exercise library with semantic search, 15-course learning system with SM-2 spaced repetition, gamification (XP/ranks/streaks/achievements/celebrations), Omni AI coach (3 modes + RAG), program continuation + Progression Report, social/challenges/feed, nutrition tracking, Stripe premium tier, push notifications, Capacitor native packaging, Playwright E2E suite, Supabase Auth + cloud sync.

**Live:** https://fitness-app-ten-eta.vercel.app

> For the full shipped feature list, see [docs/product/v1-scope.md](../product/v1-scope.md).

---

## v1.x — Maintenance & Stabilization

### v1.1 — Wearables (Full)
- Enable HealthKit (iOS) + Health Connect (Android) — full permissions flow
- Code scaffolding already in `src/lib/health.ts` and `src/components/dashboard/HealthWidget.tsx`
- Submit app update to both stores

### v1.2 — PDF Export
- Export program as formatted PDF
- Export workout history as PDF/CSV

### v1.3 — Advanced Program Progression
- Auto-suggest next session targets from adaptation results
- Deload week detection (auto-drop volume when 3 sessions show RPE ≥ 9)

### v1.4 — Beta Store Release Polish
- App Store and Play Store submission
- Store listing copy, screenshots, preview videos
- TestFlight + Google Play internal test track setup

### v1.5 — Enhanced Learning
- Interactive exercise animations (Lottie or CSS)
- Adaptive quiz difficulty based on past scores
- Video lesson integration

---

## v2.0 — Product Depth

- AI Form Coach (MediaPipe pose estimation, real-time rep feedback)
- Full wearables integration (HRV, sleep, heart rate → recovery scores)
- In-app video content (Mux/Cloudflare Stream encrypted hosting)
- Offline-first architecture (IndexedDB + background sync queue)
- Advanced AI personalization (plateau detection, fatigue periodization)

## v3.0 — B2B Gym Licensing

- Multi-tenancy architecture (gym_id RLS, per-gym Supabase projects)
- White-label + custom branding
- Gym admin dashboard (member roster, engagement analytics)
- Trainer tools (program assignment, session annotation, client reports)
- B2B pricing (per-seat SaaS, volume discounts, free trial)

> For the complete roadmap including technical details, see [docs/ROADMAP.md](../ROADMAP.md).


> Make Omnexus the best AI fitness coaching app on the market.

### 2.1 — AI Form Coach (Computer Vision)
- MediaPipe Pose / MoveNet — real-time pose estimation via device camera
- Joint angle tracking vs. ideal rep profiles
- Claude vision fallback for async clip analysis
- Works fully offline on-device

### 2.2 — Full Wearables Integration
- Heart rate, HRV, sleep score, active calories in dashboard
- Recovery score model: HRV + sleep → rest vs. train recommendation

### 2.3 — In-App Video Content
- Encrypted video hosting (Mux or Cloudflare Stream) for premium
- Full-length tutorial courses (not YouTube embeds)
- Offline video download (cache for gym use)

### 2.4 — Offline Sync & Conflict Resolution
- IndexedDB as local source of truth
- Background sync queue (service worker) → flush to Supabase on reconnect
- Conflict resolution: last-write-wins + optional merge dialog
- PWA manifest + install prompt for web users

### 2.5 — Advanced AI Personalization
- Longitudinal analysis: Claude analyzes 12+ weeks of history
- Injury risk flagging (consistent RPE spikes → suggest de-load)
- Nutrition AI: logged meals vs. training load → macro adjustments

---

## v3.0 — B2B Gym Licensing

> License Omnexus to small and mid-size gyms (mom-and-pop) as a white-label platform.
> **Model**: Per-seat SaaS + optional white-label branding fee.

### 3.1 — Multi-Tenancy Architecture
- Gym as tenant: `gym_id` column on all tables with RLS
- Gym admin role: manage members, view aggregate analytics
- Member onboarding: join via gym invite code or QR scan
- Per-gym subdomain: `crossfitwest.omnexus.app`

### 3.2 — White-Label & Custom Branding
- Gym uploads logo, sets primary/accent colors
- Branded email templates (Resend)
- Custom domain support for web app
- Build script generates branded Capacitor app per gym

### 3.3 — Gym Admin Dashboard
- Member roster, subscription status, last active
- Aggregate analytics: workout frequency, popular exercises, drop-off points
- Gym-specific program management and challenge creation
- Bulk invite: CSV upload → Resend invite flow

### 3.4 — B2B Pricing & Billing
- Per-seat licensing: $X/member/month with volume discounts
- Stripe Billing: metered billing on member activations
- 30-day free trial (no credit card required)
- Revenue share for gym referrals

### 3.5 — Trainer Tools
- Coach accounts with real-time client workout visibility
- Program assignment and session annotation
- Weekly client progress report PDF generation

---

## SDLC Notes

All work from v1.4 onward uses feature branches + PRs. No direct pushes to `main`.
See [Contributing](Contributing) for branching conventions.
