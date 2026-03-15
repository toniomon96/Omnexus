# Omnexus V1 Web + Mobile Launch Execution Board

_Date: 2026-03-15_

This board is the strict launch-readiness view for Omnexus V1. It is intentionally limited to launch-critical work only and is organized as:

- **Do now** — must be completed before public web V1 launch
- **Do next** — should begin immediately after web launch or while preparing the mobile release
- **Do later** — important follow-up work, but not required to ship V1 web

This document does **not** expand product scope. It only translates the current repository, launch docs, roadmap docs, marketing plan, and audit findings into an execution sequence.

---

## Launch Decision Summary

### Web V1

**Status:** Close to ready, but not ready to launch completely as-is.

The web app appears feature-complete for V1 and has a strong validation baseline:

- `npm run lint` passes
- `npm run build` passes
- `npm test -- --run` passes with **579** tests
- core V1 product areas are implemented across training, AI, learning, community, nutrition, billing, GDPR, and guest/account flows

### Coordinated Web + Mobile Launch

**Status:** Not yet ready as a simultaneous launch.

The codebase already has strong native groundwork via Capacitor, but store-distribution readiness is still incomplete. The main gaps are operational and release-related, not missing core app functionality.

### Recommended sequencing

1. **Finish web launch hardening**
2. **Launch web V1**
3. **Harden the existing Capacitor app for device/store release**
4. **Launch mobile**

If all mobile release dependencies are completed quickly, a near-simultaneous launch is possible. Based on the current repo state, **web-first is the lower-risk path**.

---

## Do Now — Required Before Web V1 Launch

## 1. Release Gate and QA

- [ ] Promote the release candidate through the documented branch flow (`dev -> main`)
- [ ] Run the intended release commands for the release candidate:
  - [ ] `npm run verify:local`
  - [ ] `npm run verify:dev`
  - [ ] `npm run verify:preview`
- [ ] Complete manual preview QA for the launch-critical user journeys:
  - [ ] onboarding
  - [ ] login / logout / password reset
  - [ ] guest mode
  - [ ] guest-to-account migration
  - [ ] AI program generation
  - [ ] active workout start / finish / history
  - [ ] Ask Omni
  - [ ] Insights
  - [ ] Learn
  - [ ] Nutrition
  - [ ] subscription upgrade / portal
  - [ ] Help / bug report flow

## 2. Production Configuration and Platform Setup

- [ ] Confirm Preview and Production environment variables match `docs/engineering/environment-matrix.md`
- [ ] Verify Vercel Production branch and Preview behavior match `docs/engineering/platform-setup-checklist.md`
- [ ] Confirm Supabase auth redirect URLs are correct for Local, DEV, Preview, and Prod
- [ ] Confirm all required SQL migrations are applied in the target production environment
- [ ] Seed production pgvector embeddings
- [ ] Verify Stripe live-mode configuration:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_PRICE_ID`
  - [ ] webhook endpoint registration
- [ ] Verify Upstash Redis is configured for production rate limiting
- [ ] Verify Resend domain setup for production email delivery
- [ ] Enable required GitHub branch protection and required checks on `dev` and `main`

## 3. Security and Operational Readiness

- [ ] Enforce MFA for admin/staff accounts in Supabase
- [ ] Verify HTTPS redirect behavior and HSTS in production responses
- [ ] Rotate high-impact secrets before launch:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `AUTH_ATTEMPT_PEPPER`
- [ ] Configure monitoring/alerts for:
  - [ ] `/api/signin` lockout / 401 / 429 spikes
  - [ ] `/api/ask`
  - [ ] `/api/briefing`
  - [ ] `/api/webhook-stripe`
  - [ ] notification routes
- [ ] Assign named release roles:
  - [ ] release captain
  - [ ] rollback owner
  - [ ] QA owner
  - [ ] comms owner
- [ ] Record the last known good production commit SHA and deployment URL before release

## 4. Documentation and Public-Facing Accuracy

- [ ] Ensure active docs match the actual shipped state
- [ ] Treat `docs/product/v1-scope.md` and `docs/audit/v1-release-readiness-audit-2026-03-15.md` as the current source of truth for V1 launch scope
- [ ] Mark the legacy wiki mirror as non-authoritative until refreshed
- [ ] Finalize release notes and accepted known issues

## 5. Marketing and Landing Readiness

- [ ] Finalize V1 launch messaging around the existing premium value proposition
- [ ] Fix launch-facing landing page content before public push:
  - [ ] replace placeholder screenshot content
  - [ ] replace stale or weak social-proof numbers
  - [ ] remove internal customization placeholder copy
- [ ] Decide whether the public launch entry point is:
  - [ ] `/landing`
  - [ ] the current auth/app flow
- [ ] Prepare launch copy for web, app stores, and social channels
- [ ] Prepare launch screenshots and short promo assets based on already-shipped flows

---

## Do Next — Immediately After Web Launch or In Parallel With Mobile Hardening

## 1. Mobile Release Hardening

- [ ] Keep the current React + Vite + Capacitor architecture as the mobile base
- [ ] Verify native API behavior with `VITE_API_BASE_URL`
- [ ] Run real-device QA on:
  - [ ] iOS
  - [ ] Android
- [ ] Validate mobile critical paths:
  - [ ] auth
  - [ ] onboarding
  - [ ] AI/API calls
  - [ ] guest-to-account behavior
  - [ ] subscription flow
  - [ ] export/download behavior
  - [ ] safe-area behavior
  - [ ] splash/status bar
  - [ ] Android back button

## 2. Mobile Distribution Readiness

- [ ] Add final app icon assets
- [ ] Add final splash assets
- [ ] Generate native assets and sync native projects
- [ ] Prepare App Store listing copy
- [ ] Prepare Play Store listing copy
- [ ] Capture required screenshots for iOS and Android
- [ ] Prepare preview/promo video assets if used for submission
- [ ] Complete store-compliance review before submission

## 3. Mobile Billing Decision

- [ ] Decide how premium purchase will work on native mobile
- [ ] Confirm that the chosen billing/subscription path matches store requirements
- [ ] Validate subscription upgrade/downgrade paths on real devices before mobile release

## 4. Mobile Capability Boundaries

- [ ] Keep native push notifications explicitly out of launch scope unless they are fully implemented and tested
- [ ] Keep HealthKit / Health Connect full integration deferred to post-V1 mobile work
- [ ] Verify that unsupported native behaviors fail safely and are not presented as active launch features

---

## Do Later — Post-Launch Follow-Up, Not Web V1 Blockers

## 1. Product and Technical Follow-Up

- [ ] Offline/degraded-mode E2E coverage expansion
- [ ] Guest-to-account migration race-condition coverage
- [ ] AI response edge-case coverage
- [ ] Native/mobile smoke automation
- [ ] Stripe + cron integration verification improvements
- [ ] Fix the `localStorage.ts` chunking warning

## 2. Documentation Improvements

- [ ] Refresh or retire `docs/wiki/`
- [ ] Add a tighter engineer onboarding path across setup/release docs
- [ ] Keep active counts and readiness wording current in public docs

## 3. Marketing Expansion Plan Work That Is Not Required for Web V1

- [ ] New Year campaign timing
- [ ] annual-plan install/onboarding optimization
- [ ] public SEO expansion for exercise/library/learning surfaces
- [ ] referral incentive tuning
- [ ] gym/studio licensing preparation
- [ ] employer/frontline-worker distribution preparation

## 4. Post-V1 Roadmap Items That Should Stay Out of This Launch

- [ ] PDF export
- [ ] AI form coach / computer vision
- [ ] offline-first IndexedDB sync architecture
- [ ] full HealthKit / Health Connect ingestion
- [ ] richer premium video/media system
- [ ] B2B multi-tenancy / gym admin tooling

---

## Web Launch Go / No-Go Rule

Omnexus web V1 is ready to launch **only when** all of the following are true:

- release-candidate verification is green
- manual preview QA is complete for the core user journeys
- production environment and billing configuration are verified
- launch-facing documentation and messaging are accurate
- security and rollback ownership are explicitly assigned

If those conditions are met, you can proceed with **web launch immediately** and move directly into mobile hardening.

---

## Mobile Development Starting Point

If the web launch is cleared, the recommended first mobile phase is:

### Phase 1 — Harden the existing Capacitor app for production distribution

Focus on:

- native environment correctness
- real-device QA
- store assets and submission materials
- billing/subscription compliance
- native UX validation

### Why this is the right starting point

- the backend APIs are already reusable
- the current frontend architecture is already shared across web and native
- the repo already contains native wrappers and native utility helpers
- the launch gaps are mostly operational and platform-specific, not evidence of a required rewrite

### Shared-logic considerations to watch closely

- localStorage vs hydrated account state
- guest-to-account migration
- native vs web push behavior
- file export/download behavior in native WebViews
- large static client bundles on mobile devices

### Recommended mobile development order

1. verify native API/auth behavior
2. complete icon/splash/store assets
3. run real-device QA
4. settle the billing/subscription path
5. fix any native-specific launch blockers
6. ship beta/internal builds
7. launch public mobile release

---

## Final Recommendation

**Do not delay web V1 for non-launch-critical roadmap work.**

The current repo appears close enough that, once the **Do Now** section is completed, you should be able to:

1. launch the web app, and then
2. proceed directly into mobile hardening on the current architecture

That is the fastest path to a coordinated Omnexus web + mobile launch without expanding scope or rewriting already-shipped systems.
