# Omnexus Sprint 4 Issue Drafts

Purpose:
Ticket-ready issue drafts for Sprint 4 AI quality and cohesion work.

## P0 Issue 1

Title:
[Feature] Standardize AI error handling across Ask, Insights, and Program Generation

Labels:

- enhancement
- ai
- reliability
- ux

Priority:
P0

Problem:
AI surfaces currently handle network/API failures differently, creating inconsistent user trust and unclear retry behavior.

Acceptance criteria:

- Shared AI error-normalization utility exists.
- Ask, Insights, and AI Program Generation consume the shared utility.
- Daily-limit upgrade flow in Ask remains intact.

Suggested files:

- src/lib/aiErrorHandling.ts
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

## P0 Issue 2

Title:
[Feature] Add consistent degraded-state and retry UX for AI surfaces

Labels:

- enhancement
- ai
- ux

Priority:
P0

Problem:
Users receive inconsistent fallback language and retry affordances when AI requests fail.

Acceptance criteria:

- Shared degraded-state panel is used across AI pages.
- Retry action is explicit and consistent.
- Copy is plain-language and action-oriented.

Suggested files:

- src/components/ui
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx

## P1 Issue 3

Title:
[Feature] Align AI output next-step framing across Ask and Insights

Labels:

- enhancement
- ai
- product-loop

Priority:
P1

Problem:
AI responses can feel disconnected from next product actions, reducing follow-through.

Acceptance criteria:

- Ask and Insights use consistent next-step wording patterns.
- CTA destinations stay context-aware.

Suggested files:

- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/lib/analytics.ts

## P1 Issue 4

Title:
[Feature] Add AI fallback analytics for shown, retry, and recovery events

Labels:

- enhancement
- ai
- analytics

Priority:
P1

Problem:
Sprint 4 quality cannot be measured without visibility into fallback and retry behavior.

Acceptance criteria:

- Events for fallback shown, retry clicked, and recovered are emitted.
- Payload includes surface and normalized error category.

Suggested files:

- src/lib/analytics.ts
- src/pages/AskPage.tsx
- src/pages/InsightsPage.tsx
- src/pages/AiProgramGenerationPage.tsx
