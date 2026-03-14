# Omnexus Market Expansion Plan

Actionable implementation plan derived from the Market Expansion Research and Business Strategy document.

---

## Strategic Positioning

Omnexus is not a workout tracker. It is a **personalized transformation system** grounded in data and behavior design — combining strength training guidance, recovery intelligence, fitness education, and AI coaching into a single cohesive product.

The 2025–2026 market is moving toward "fitness as a holistic health experience" (strength + recovery + longevity + coaching + community). This positioning fits that movement exactly. The roadmap should always lead with this framing.

---

## Phase 1 — Strengthen the Consumer Core (B2C)

**Goal:** Make the $12.99/month Premium subscription undeniably worth it before investing in distribution.

### Action Items

- [ ] **Finalize the premium value proposition.** Premium must clearly mean: personalized coaching + education + progress intelligence — not a workout list. Gate appropriately so free users understand the delta.
- [x] **Complete the Exercise Library expansion to 300+ exercises.** ✅ 307 exercises shipped (barbell, dumbbell, bodyweight — modular library in `src/data/exercises/`). Strength training is the dominant demand signal. Movement patterns, swaps, and technique education are higher-value investments than generic workout lists. (See `docs/exercise-library.md`.)
- [x] **Ship the gamified Learning System.** ✅ Shipped: Duolingo-style XP, streaks, daily challenges, SM-2 spaced repetition, 15 courses, achievement toasts, rank-up celebrations, and course completion certificates. (See `docs/learning-system.md`.)
- [x] **Implement Smart Progressive Overload recommendations.** ✅ Shipped: `src/lib/progressiveOverload.ts` engine feeds next-session weight and RPE suggestions, surfaced in post-workout adaptation flow.
- [ ] **Launch the Body Transformation Timeline.** A visual personal artifact combining workout heatmap, weight lifted trends, body measurements, XP, and learning completions. This becomes a deeply personal reason to stay.
- [x] **Build the Program Continuation Intelligence flow.** ✅ Shipped: After an 8-week block ends, the system generates a Progression Report and offers three continuation paths. (See `docs/program-continuation.md`.)

### Pricing Confirmation

| Channel | Net Revenue per $12.99 |
|---|---|
| Apple App Store (Year 1) | ~$9.09 (70% net) |
| Apple App Store (Year 2+) | ~$11.04 (85% net) |
| Google Play | ~$9.09–$11.04 (tiered) |
| Web (Stripe only) | ~$12.31 (2.9% + $0.30) |

**Implication:** Encourage annual plans for cash flow stability. Promote web purchase where permissible. Budget AI compute costs against the lower app-store net figure for conservative forecasting.

---

## Phase 2 — Consumer Segment Expansion (Multi-demographic B2C)

**Goal:** Grow without splintering the product. One platform, three consumer contexts, distinct onboarding/packaging/messaging.

### Segment 1 — Gym-Context Consumers (Commercial gyms + boutique studios)

**Size:** ~77M U.S. fitness facility members (HFA 2024), ~96M total when including pay-as-you-go and insurance/employer users.

**What they care about:** Progressive overload guidance, form confidence, efficient workouts, consistency.

**Action Items:**
- [ ] Build onboarding path for gym-context (equipment selection: full commercial gym).
- [ ] Create program bundles: "Commercial Gym Beginner Confidence," "Intermediate Hypertrophy," "Powerlifting Foundation."
- [ ] Retention messaging: "beat last week's top set" framing. Highlight PR confetti and set PRs prominently.
- [ ] Note competitive floor: Planet Fitness offers on-demand workouts and equipment tutorials in its own app. Omnexus must exceed that baseline with intelligence and personalization.

### Segment 2 — Home-Context Consumers (Home gym, partial equipment, apartment)

**What they care about:** Working with what they have. Constraint-driven personalization.

**Action Items:**
- [ ] Ensure Equipment Swap system is prominent and fast. This is the primary retention defense for home users.
- [ ] Build onboarding path for home-context (equipment selection: dumbbells only, resistance bands, no barbell, etc.).
- [ ] Create program bundles: "Home Gym Hypertrophy," "Dumbbell-Only Strength," "Apartment No-Noise Routine."
- [ ] Retention messaging: "minimum effective dose" framing. Emphasize that consistency beats perfection.

### Segment 3 — No-Equipment and Micro-Session Consumers (Truck drivers, traveling workers, deskless professionals)

**Why this matters:** CDC/NIOSH data shows ~69% of long-haul truck drivers are obese (vs. ~31% of U.S. working adults). This is a high-need, underserved group. It is also a distribution wedge into employer/fleet wellness programs.

**Action Items:**
- [ ] Build onboarding path: "no equipment, 10–20 minute sessions, hotel room or truck stop."
- [ ] Create program bundles: "10-Minute Strength Micro-Sessions," "Hotel Gym Hypertrophy," "No Equipment Daily Movement."
- [ ] Design daily challenge and streak mechanics that work for irregular schedules (streak freeze, flexible daily windows).
- [ ] Retention messaging: "keep the streak," "minimum effective dose," "every session counts."
- [ ] Flag this segment as a commercial pipeline into employer wellness (Phase 4).

---

## Phase 3 — Mobile App Distribution

**Goal:** Make Omnexus a true mobile-first product. Mobile fitness downloads hit 3.6B in 2024 (+6% YoY). App store revenue is projected to surpass $4B in 2025. January IAP revenue was a record $385M — timing campaigns around New Year demand spikes is a high-ROI action.

### Action Items

- [x] **App Store release — Capacitor builds complete.** ✅ Capacitor v8 iOS and Android native projects are generated and committed (`ios/`, `android/`). Haptics, status bar, splash screen, safe areas, and Android back button are all wired. Run `npm run cap:sync` and submit via Xcode (iOS) or Android Studio (Android). See `docs/MOBILE.md` for the full delivery checklist.
- [ ] **New Year campaign timing.** Plan a launch or major update push for late December / early January to capture the seasonal demand spike.
- [ ] **Annual plan push at install.** Offer a discounted annual plan at the end of onboarding. This converts seasonal intent into year-long retention and improves margin.
- [ ] **Monitor the React Native New Architecture.** If Capacitor limits motion quality or cross-platform consistency in v2, evaluate migrating to Expo with EAS Build for a unified UI primitives and motion system across platforms.
- [ ] **Comply with App Store review requirements** across UI, functionality, and store behavior before each submission.
- [ ] **Configure subscription economics correctly.** Ensure Apple and Google subscription billing is configured with correct product IDs and upgrade/downgrade paths. Consider offering web checkout as a parallel option for users who prefer it.

---

## Phase 4 — Gym and Studio Licensing (B2B)

**Goal:** Reduce reliance on paid consumer acquisition by monetizing at the location or member-base level.

### Licensing Package Structure

| Tier | Target | Value |
|---|---|---|
| **Starter License** | Single-location independent gym or studio | Retention tools, learning system, programs, basic analytics |
| **Growth License** | Multi-location gym, high-engagement boutique | Advanced analytics, challenges, deeper integrations, custom branding |
| **Enterprise/Franchise License** | Franchise chains, large fitness operators | SSO, reporting suite, API integrations, white-label options |

### Integration Path (Do Not Replace Core Systems)

Large chains have proprietary app ecosystems. The integration route is the **operating-system layer** used by independent operators:

| Platform | Integration Type |
|---|---|
| **ABC Fitness** | Published API developer portal with OAuth-secured endpoints |
| **Mindbody** | Developer portal with public API documentation |
| **Daxko / Zen Planner** | OpenAPI documentation available |
| **ClassPass** | Developer portal with Inventory API for schedules/transactions |

**What to synchronize:** Identity, membership status, check-in events, and basic profile. Gyms see Omnexus as retention infrastructure — not a competing membership system.

### Action Items

- [ ] **Define the "Omnexus for Gyms" MVP scope.** Minimum: branded program delivery, learning access, and basic member progress reporting for gym staff.
- [ ] **Evaluate ABC Fitness API integration first** — largest independent gym market share. Build OAuth flow and member identity sync.
- [ ] **Build a gym admin dashboard.** Staff-facing view showing member engagement, lesson completions, and program adherence. This is the value artifact that gyms renew for.
- [ ] **Position Omnexus as retention infrastructure, not competition.** Messaging: "Give your members a world-class coaching app included with their membership."
- [ ] **Pilot with 2–3 independent gyms** before building the full integration layer. Validate that operators actually use the admin dashboard and report member value.
- [ ] **Establish negotiated pricing.** B2B pricing is a value sale. Do not publish a sticker price for enterprise. Use "per location" or "per active member" as the billing units.

---

## Phase 5 — Employer and Wellness Benefits (B2B2C)

**Goal:** Reach the deskless and frontline workforce through employer channels.

**Market context:** HFA includes insurance/employer program members as 31% of total U.S. fitness customer penetration. Employer wellness is a credible distribution channel for a product positioned as "frontline-ready fitness and education system."

### Action Items

- [ ] **Build employer/team access tier.** Per-employee access bundled via employer wellness benefits. Same core product, different economic buyer.
- [ ] **Create a "Frontline Worker" onboarding track.** No equipment, 10–20 minute sessions, irregular schedules. Relevant for truck fleets, warehouse operations, logistics companies.
- [ ] **Develop a pilot proposal template.** Used to approach employers and fleet operators. Quantify ROI using CDC/NIOSH health risk data for the target workforce.
- [ ] **Investigate health insurance partnership pathway.** Many insurers offer app subsidies (e.g., through Digital Health programs). This is a longer-term distribution lever but worth researching in parallel.

---

## Phase 6 — Visual and UX Evolution (V2 Design Leap)

**Goal:** Create a design system that delivers a "dramatically better" perceived quality — not through new features, but through a cohesive, calm, premium visual language.

### Design System Foundation

- [ ] **Establish a core design language.** Define: type scale, spacing scale, color roles, and icon library rules. One unified system applied everywhere.
- [ ] **Build a component library.** Buttons, cards, tabs, chips, lesson blocks, exercise blocks — all drawn from the same system.
- [ ] **Create a motion language.** Animation serves three purposes: state change, celebration, and guidance — not decoration. Celebrations (rank-ups, streak milestones, PR confetti) should feel special because the rest of the UI is calm and premium.
- [ ] **Audit and fix icon inconsistencies.** Consistent line weights, filled vs. outline rules, and metaphor clarity across all icons.
- [ ] **Align with platform guidelines.** Reference Apple Human Interface Guidelines and Material Design 3 for platform-native feel. iOS users expect HIG-compliant patterns. Android users expect Material 3 motion and color system.

### Reference Benchmarks

- Apple Fitness+ — cohesive premium aesthetic, motion tied to meaningful workout moments
- Strava — clean data visualization, segment leaderboards, community integration
- Fitbod — exercise-focused UI with smart program intelligence

---

## Phase 7 — Agentic AI and DevOps Upgrade

**Goal:** Use AI-native workflows to raise the floor across the entire product — faster iteration on content quality, tighter UI consistency, better performance, safer experimentation.

### Agentic Development Loop

1. Write a well-scoped spec (or refine an issue).
2. Assign the issue to a GitHub Copilot coding agent.
3. Agent writes code and runs tests in CI.
4. Review like a senior engineer — focus on architecture and correctness.

**Best suited for:** Polish tasks, refactors, content pipelines, UI consistency, migration scripts, documentation updates, test generation, and release notes.

### Action Items — Agentic Tooling

- [ ] **Adopt GitHub Copilot agent mode** for well-scoped enhancement issues. Use the coding agent for Sprint A–K tasks from `docs/Program_Mastery.md`.
- [ ] **Evaluate Claude Code + MCP** for design-doc-aware agent workflows. MCP tool boundaries let agents read design docs and interact with external systems (database, content files, API specs).
- [ ] **Build MCP-style tool boundaries** into product and company systems to maximize what agents can safely own.

### Action Items — Observability Foundation

- [ ] **Instrument with OpenTelemetry.** Vendor-neutral telemetry across traces, metrics, and logs. Instrument: workout flow latency, lesson completion drop-off, XP write failures, streak freeze usage anomalies, search latency and error rates.
- [ ] **Unify product analytics and reliability telemetry.** The same "event log" mindset used for XP (`xp_events`) should extend to operational signals.
- [ ] **Treat observability as prerequisite to scale.** Before scaling paid acquisition, ensure you can detect behavior changes and regressions — especially in personalization, learning streaks, and XP accounting.

---

## Demo and Go-to-Market Asset Plan

**Context:** Mobile fitness downloads spike 10%+ in January (New Year demand). A great demo launched at the right moment can materially improve conversion without adding a single feature.

### Demo Package

- [ ] **60–90 second hero video.** Flow: onboarding → personalized plan → workout guidance → streak/XP → progress timeline. Shot to show the transformation narrative.
- [ ] **Web-based interactive walkthrough.** For investors, gyms, and partners. Shows the core feature tour without requiring an app install.
- [ ] **3–5 short vertical clips** for individual outcomes: "first week streak," "equipment swap," "coach notes," "learning path." Used for social media, App Store preview, and B2B pitch decks.

---

## Success Metrics

| Area | Metric | Target |
|---|---|---|
| Consumer B2C | Monthly active users | Growing MoM |
| Consumer B2C | Premium conversion rate | >5% of registered users |
| Consumer B2C | 30-day retention | >40% |
| Consumer B2C | Annual plan adoption | >30% of premium subscribers |
| Exercise Library | Library size | 300+ exercises |
| Learning System | Daily lesson completion rate | >20% of active users |
| Learning System | Average learning streak | >7 days |
| Mobile | App Store rating | ≥4.5 stars |
| B2B Licensing | Gym pilot contracts | 2–3 signed pilots |
| B2B Licensing | Pilot gym admin DAU | Weekly active gym staff |
| Observability | Error detection time | <15 minutes for P1 |

---

## Cross-Reference

| This Plan Section | Related Documents |
|---|---|
| Exercise Library expansion | `docs/exercise-library.md`, `docs/Program_Mastery.md` Part One |
| Learning System and gamification | `docs/learning-system.md`, `docs/gamification.md`, `docs/Program_Mastery.md` Parts Two–Three |
| AI Coach evolution | `docs/ai-coach.md`, `docs/Program_Mastery.md` Part Three |
| Program Continuation | `docs/program-continuation.md`, `docs/Program_Mastery.md` Part Three |
| Sprint schedule | `docs/Program_Mastery.md` Part Five (Sprints A–K) |
| Release strategy | `docs/RELEASE_STRATEGY.md` |
| Product roadmap | `docs/ROADMAP.md` |
