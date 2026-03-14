# Omnexus Sprint 2 Issue Drafts

Purpose:
These drafts convert Sprint 2 planning into ticket-ready GitHub issues focused on core-loop clarity.

Usage:

- Create one GitHub issue per draft.
- Keep the title format as written unless sprint planning requires refinement.
- Copy the sections into either the feature or bug template as appropriate.
- Link each issue back to `docs/SPRINT_2_BACKLOG.md`.

## P0 Issue 1

Title:
`[Feature] Make Dashboard present one dominant next-step CTA by user state`

Labels:

- `enhancement`
- `product-loop`
- `ux`
- `release-blocker`

Priority:
P0

Problem:
Dashboard currently surfaces multiple useful actions, but not with enough hierarchy to make the next best action obvious.

Proposed solution:
Refactor Dashboard hero behavior so it selects one dominant CTA for active session, active program, and no-program users while keeping supporting context secondary.

Scope:

- Define explicit Dashboard CTA branches by user state
- Ensure one action is visually primary above the fold
- Preserve supporting context without equal visual weight

Acceptance criteria:

- Users with an active session see resume as the primary action.
- Users with an active program see today's workout as the primary action.
- Users without a program see an intentional no-program path.
- Secondary feature cards do not visually outrank the primary CTA.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/TodayCard.tsx`

Test plan:

- Integration or component coverage for CTA branch selection
- E2E for active session and active program Dashboard states

Dependencies:

- None

Definition of done:

- Dashboard hierarchy is state-driven and obvious
- Dominant CTA is stable across mobile and desktop layouts

## P0 Issue 2

Title:
`[Feature] Restructure Train page around workout readiness instead of overlapping actions`

Labels:

- `enhancement`
- `product-loop`
- `ux`
- `release-blocker`

Priority:
P0

Problem:
Train can ask the user to choose between too many equally prominent actions, especially when no program is active.

Proposed solution:
Rebuild Train around explicit readiness states so only one action is primary in each case.

Scope:

- Active session resume state
- Active program start state
- No-program fallback state
- Deliberate Quick Log positioning

Acceptance criteria:

- Only one action is visually primary per Train state.
- No-program users understand why Browse Programs and Quick Log are both present.
- The page no longer feels like two competing entry points stitched together.

Suggested files:

- `src/pages/TrainPage.tsx`
- shared CTA helpers/components as needed

Test plan:

- E2E for active-session resume, active-program start, and no-program fallback

Dependencies:

- None

Definition of done:

- Train reflects workout readiness clearly
- Primary CTA order is intentional and test-covered

## P1 Issue 3

Title:
`[Feature] Align no-program guidance between Dashboard and Train`

Labels:

- `enhancement`
- `product-loop`
- `ux`

Priority:
P1

Problem:
Dashboard and Train currently handle no-program users with similar but not identical intent, which weakens loop clarity.

Proposed solution:
Unify no-program copy, CTA ordering, and user guidance across both surfaces.

Scope:

- Shared no-program copy strategy
- Consistent CTA ordering
- Consistent Quick Log framing

Acceptance criteria:

- No-program messaging reads consistently on both pages.
- Browse Programs and Quick Log are ordered intentionally.
- Users do not encounter contradictory guidance when moving between pages.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`

Test plan:

- E2E for no-program state on both pages

Dependencies:

- P0 Issue 1
- P0 Issue 2

Definition of done:

- Copy and CTA order are aligned across both no-program surfaces

## P1 Issue 4

Title:
`[Feature] Standardize guided-mode action copy across Dashboard and Train`

Labels:

- `enhancement`
- `guided-mode`
- `ux`

Priority:
P1

Problem:
Guided-mode users are more sensitive to inconsistent language, and the current loop surfaces do not always describe the next step the same way.

Proposed solution:
Review and normalize CTA labels and short explanatory copy across Dashboard and Train for guided mode.

Scope:

- Primary CTA labels
- Short helper copy
- No-program explanatory text

Acceptance criteria:

- Guided-mode labels are consistent across the two core loop surfaces.
- Copy favors plain language over internal or advanced fitness jargon.
- The user can move between Dashboard and Train without relearning the vocabulary.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`
- relevant shared components

Test plan:

- Manual QA on guided mode
- E2E spot checks for label presence

Dependencies:

- P0 Issue 1
- P0 Issue 2

Definition of done:

- Guided-mode language is consistent and reviewed

## P1 Issue 5

Title:
`[Feature] Add dominant-CTA analytics for Dashboard and Train hierarchy states`

Labels:

- `enhancement`
- `analytics`
- `product-loop`

Priority:
P1

Problem:
Sprint 2 cannot be evaluated well if the product does not record which dominant actions users are shown and click.

Proposed solution:
Add structured analytics for dominant CTA shown and dominant CTA clicked across the main Dashboard and Train hierarchy states.

Scope:

- Event wrapper in analytics layer
- Dashboard call sites
- Train call sites
- State payloads for active session, active program, and no-program branches

Acceptance criteria:

- Events fire when the dominant CTA is shown.
- Events fire when the dominant CTA is clicked.
- Payloads distinguish the relevant hierarchy state.
- Naming aligns with existing analytics conventions.

Suggested files:

- `src/lib/analytics.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`

Test plan:

- Unit tests for analytics helper behavior
- Manual QA note for expected event emission per state

Dependencies:

- P0 Issue 1
- P0 Issue 2

Definition of done:

- The new hierarchy is measurable in analytics
- Event contract is clear enough for PM and QA review