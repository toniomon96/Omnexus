# Omnexus Sprint 2 Backlog

Sprint name: Core Loop Clarity

Recommended duration: 2 weeks

Primary objective:
Make the next best action obvious on Dashboard and Train so users stop hesitating between overlapping workout entry points.

## Sprint Status

Prerequisite:
Sprint 1 implementation is complete in the repo, with final Actions validation and manual QA signoff still owned by release execution.

Current implementation status:

- Story 1.1 is implemented in repo: Dashboard now resolves one dominant next step for active-session, program-ready, and no-program states.
- Story 1.2 is implemented in repo: secondary Dashboard discovery actions have been visually softened, duplicate Quick Session exposure is reduced when the no-program hero already presents that option, and active-session Dashboard state suppresses optional discovery sections so Resume Workout remains dominant.
- Story 2.1 is implemented in repo: Train now resolves one dominant next step for active-session, program-ready, and no-program states.
- Story 2.2 is implemented in repo: no-program CTA ordering and copy are aligned across Dashboard and Train, with Browse Programs primary and Quick Session positioned as the fast alternative.
- Story 3.2 is implemented in repo: dominant CTA shown and clicked analytics exist for Dashboard and Train.
- Story 3.1 is implemented in repo: shared training labels now extend beyond Dashboard and Train into supporting entry surfaces including Help, Quick Session, guided pathways, briefing, and onboarding.
- Sprint 2 implementation is complete in repo. Manual QA and release-owner verification remain the remaining signoff tasks.

## Sprint Goal

By the end of Sprint 2:

- Dashboard answers "what should I do next?" within one screenful.
- Train no longer presents program training and Quick Session as competing primary actions.
- No-program users land on an intentional path instead of a dead-end or duplicate CTA set.
- Guided-mode copy is consistent across Dashboard and Train.

## Sprint Success Metrics

- Dashboard dominant CTA click-through is measurably higher than the baseline.
- Train page fallback-to-Quick-Session behavior is clearer and more intentional.
- No-program users reach either Browse Programs or Quick Session without hesitation.
- Golden-path E2E remains deterministic after CTA restructuring.

## Sprint Scope Guardrails

In scope:

- Dashboard action hierarchy
- Train page action hierarchy
- No-program state clarity
- Guided-mode copy consistency for these surfaces
- Analytics and tests required to validate the loop change

Out of scope:

- Broad visual redesign unrelated to action clarity
- New dashboard modules unrelated to the next-action decision
- New AI feature expansion
- Major retention work reserved for Sprint 3

## Epic 1: Dashboard Action Hierarchy

Goal:
Make Dashboard present one clear primary action without competing equal-weight prompts.

### Story 1.1: Simplify Dashboard hero into a single dominant next step

Problem:
Dashboard currently mixes workout continuity, feature discovery, and supporting modules in ways that can weaken the primary action.

User story:
As a user, I want the Dashboard to make my next action obvious so I can train without scanning multiple cards first.

Acceptance criteria:

- The hero area has one dominant CTA based on the user's real state.
- Supporting context exists, but does not visually compete with the primary CTA.
- The hierarchy works for active session, active program, and no-program cases.
- The above-the-fold area communicates continuity before exploration.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/TodayCard.tsx`
- related dashboard components as needed

Test plan:

- Component or integration coverage for CTA branch selection.
- E2E coverage for guest with active program and active-session resume path.

Labels:

- `product-loop`
- `ux`
- `release-blocker`

### Story 1.2: Reduce secondary Dashboard actions that compete with the training CTA

Problem:
Feature discovery cards can be valuable, but they currently compete too directly with the main training continuation path.

User story:
As a user, I want supporting actions to feel optional, not equally urgent as my next workout.

Acceptance criteria:

- Secondary feature cards are still discoverable.
- Secondary actions do not visually outrank the primary training CTA.
- Dashboard still exposes Measurements, Library, Quick Session, and other tools without fragmenting focus.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/*.tsx`

Test plan:

- Visual and interaction QA on desktop and mobile.
- E2E confirmation that the main workout CTA remains present after the change.

Labels:

- `ux`
- `product-loop`

## Epic 2: Train Page Clarity

Goal:
Make Train reflect workout readiness clearly instead of offering overlapping entry points.

### Story 2.1: Restructure Train page around readiness states

Problem:
Train can present too many equally strong actions when the user has a program, no program, or an active session.

User story:
As a user, I want Train to reflect whether I should resume, start today's workout, browse programs, or use Quick Session.

Acceptance criteria:

- Train has explicit readiness states for active session, active program, and no-program paths.
- Only one action is visually primary in each state.
- The no-program state explains why Quick Session exists instead of making it feel like a competing default.

Suggested files:

- `src/pages/TrainPage.tsx`
- relevant shared workout CTA helpers/components

Test plan:

- E2E coverage for active-session resume, active-program start, and no-program fallback.

Labels:

- `product-loop`
- `ux`
- `release-blocker`

### Story 2.2: Align no-program states between Dashboard and Train

Problem:
Dashboard and Train both handle missing program state, but not with the same intent or visual logic.

User story:
As a user without a program, I want consistent guidance no matter whether I start from Dashboard or Train.

Acceptance criteria:

- No-program copy and CTA ordering are consistent across Dashboard and Train.
- Browse Programs remains the default path when appropriate.
- Quick Session is presented as the intentional fast path, not a fallback hidden behind ambiguity.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`

Test plan:

- E2E coverage for guest no-program state on both surfaces.

Labels:

- `ux`
- `product-loop`

## Epic 3: Guided-Mode Consistency and Measurement

Goal:
Ensure the simplified loop is understandable and measurable.

### Story 3.1: Normalize guided-mode language across primary training surfaces

Problem:
Guided-mode language currently varies enough that the product can feel inconsistent even when the flows work.

User story:
As a newer user, I want the app to describe my next step in plain, consistent language.

Acceptance criteria:

- Guided-mode labels and explanatory copy match across Dashboard and Train.
- Supporting entry surfaces such as Help, Quick Session, and guided pathways do not reintroduce conflicting training labels.
- Quick Session, Browse Programs, Start Workout, and Resume Workout labels are used intentionally and consistently.
- Copy avoids advanced terminology when a simpler phrase exists.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`
- shared components used by those pages

Test plan:

- Manual QA for guided mode on mobile widths.
- E2E spot checks for primary CTA labels.

Labels:

- `ux`
- `guided-mode`

### Story 3.2: Add dominant-CTA analytics for Dashboard and Train

Problem:
The team cannot validate Sprint 2 if the new hierarchy is not measurable.

User story:
As the team, we want to measure whether the clearer action hierarchy actually changes behavior.

Acceptance criteria:

- Dashboard and Train emit structured events for the dominant CTA shown and clicked.
- Event names align with existing analytics conventions.
- The event payload distinguishes key states such as active session, active program, and no program.

Suggested files:

- `src/lib/analytics.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/TrainPage.tsx`

Test plan:

- Unit tests for analytics helper wrappers.
- Manual QA note confirming expected events for each major state.

Labels:

- `analytics`
- `product-loop`

## Sprint Dependency Order

Recommended implementation order:

1. Story 1.1
2. Story 2.1
3. Story 2.2
4. Story 1.2
5. Story 3.1
6. Story 3.2

Rationale:

- Establish the main state-driven CTA logic first.
- Align Train and Dashboard before polishing secondary actions.
- Add measurement after the intended hierarchy is stable enough to instrument.

## Suggested Sprint Board Columns

- Ready
- In progress
- In review
- QA
- Done

## Suggested Owner Split

- Frontend owner: Stories 1.1, 1.2, 2.1, 2.2, 3.1
- Platform/analytics owner: Story 3.2
- Product/design owner: acceptance review for Stories 1.1, 1.2, 2.1, 2.2, 3.1
- QA/release owner: regression coverage and golden-path review

## Sprint Review Demo Script

Demo these journeys in order:

1. Guest with active program opens Dashboard and sees one dominant next step
2. User with active session returns and resumes without scanning multiple cards
3. No-program user sees aligned guidance on Dashboard and Train
4. Quick Session remains available, but clearly framed as the fast alternative
5. Analytics events show which dominant CTA was shown and clicked

## Definition of Done for Sprint 2

Sprint 2 is complete only when:

- Dashboard and Train present one dominant action per major readiness state.
- No-program states are consistent across both surfaces.
- Golden-path tests cover the critical hierarchy branches.
- CTA instrumentation exists for the new hierarchy.

Related execution docs:

- [Sprint 2 issue drafts](SPRINT_2_ISSUE_DRAFTS.md)