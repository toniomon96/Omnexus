# Omnexus Sprint 4 Backlog

Sprint name: AI Quality and Product Cohesion

Recommended duration: 2 weeks

Primary objective:
Improve AI reliability, clarity, and actionability across Ask, Insights, and AI Program Generation without adding new top-level product surfaces.

## Sprint Status

Current status:

- Sprint 4 started in repo on 2026-03-12.
- Story 1.1 is implemented: shared AI error-normalization helper is live across Ask, Insights, and AI Program Generation.
- Story 1.2 is implemented: shared degraded-state/retry panel is now used across Ask, Insights, and AI Program Generation.
- Story 2.1 is implemented: Ask and Insights now share a consistent "Recommended next step" CTA pattern and aligned analytics labels.
- Story 2.2 is implemented: AI Program Generation and Dashboard now use explicit draft-ready handoff states with clear review vs keep-current actions.
- Story 3.2 is implemented: fallback analytics events now capture shown, retry-clicked, and recovered states across Ask, Insights, and AI Program Generation.
- Story 3.1 is implemented: unit coverage for AI error normalization and E2E spot checks for Ask/Insights degraded-retry paths are added in repo.
- Remaining work is focused on manual QA and release-owner signoff.

## Sprint Goal

By the end of Sprint 4:

- AI surfaces present consistent loading, error, and retry behavior.
- Failures are actionable and understandable instead of vague.
- AI outputs feel connected to the next product action.
- Release confidence stays high with deterministic quality signals.

## Sprint Success Metrics

- Reduced AI-request abandonment on Ask and Insights.
- Lower repeated retries after first AI error.
- Better conversion from AI outputs to next-step actions.
- Fewer CI regressions tied to AI states.

## Scope Guardrails

In scope:

- Ask, Insights, and AI Program Generation request-state consistency
- Retry and degraded-state copy and behavior
- Analytics for shown/clicked/retried in AI error states
- Targeted E2E and unit coverage for AI fallback paths

Out of scope:

- New AI feature families or major new routes
- Broad Dashboard redesign
- Large backend architecture rewrites

## Epic 1: AI Request-State Consistency

Goal:
Standardize loading, error, and retry semantics across all primary AI surfaces.

### Story 1.1: Shared AI error normalization and fallback messaging

Status: Implemented (2026-03-12)

Acceptance criteria:

- Shared helper maps transport/API errors into normalized user-facing messages.
- Ask, Insights, and AI Program Generation use the shared helper.
- Ask upgrade gating remains intact for daily-limit responses.

Suggested files:

- src/lib/aiErrorHandling.ts
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

### Story 1.2: Standard retry/degraded-state panel component

Status: Implemented (2026-03-12)

Acceptance criteria:

- AI surfaces display a consistent degraded panel with retry affordance.
- Retry behavior is explicit and non-destructive.
- Error language is plain and action-oriented.

Suggested files:

- src/components/ui (new shared panel)
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

## Epic 2: Output-to-Action Cohesion

Goal:
Ensure AI responses naturally lead users into the next useful action.

### Story 2.1: Align next-step CTAs and copy across Ask and Insights

Status: Implemented (2026-03-12)

Acceptance criteria:

- Ask completion and Insights recommendation use consistent next-step framing.
- CTA wording avoids overclaiming and remains context-aware.

Suggested files:

- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/lib/analytics.ts

### Story 2.2: Improve AI Program Generation completion handoff

Status: Implemented (2026-03-12)

Acceptance criteria:

- Program generation states clearly explain what happens to current program.
- Completion/ready states direct users to review and activate with no ambiguity.

Suggested files:

- src/pages/AiProgramGenerationPage.tsx
- src/pages/DashboardPage.tsx

## Epic 3: Delivery Confidence for AI Paths

Goal:
Increase test confidence around AI degraded and retry paths.

### Story 3.1: Add focused tests for degraded and retry flows

Status: Implemented (2026-03-12)

Acceptance criteria:

- Unit tests cover AI error normalization branches.
- E2E spot checks validate retry/degraded UI paths for Ask and Insights.

Suggested files:

- src/lib/aiErrorHandling.test.ts
- tests/e2e/ask.spec.ts
- tests/e2e/insights.spec.ts

### Story 3.2: Add AI fallback analytics instrumentation

Status: Implemented (2026-03-12)

Acceptance criteria:

- Events exist for AI error shown, retry clicked, and successful recovery.
- Event payloads include surface and normalized error category.

Suggested files:

- src/lib/analytics.ts
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx
