# Omnexus Sprint 3 Issue Drafts

Purpose:
These drafts convert Sprint 3 planning into ticket-ready GitHub issues focused on motivation and retention.

Usage:

- Create one GitHub issue per draft.
- Keep the title format as written unless sprint planning requires refinement.
- Copy the sections into either the feature or bug template as appropriate.
- Link each issue back to `docs/SPRINT_3_BACKLOG.md`.

## P0 Issue 1

Title:
`[Feature] Redesign workout completion to reinforce progress and present one clear next step`

Labels:

- `enhancement`
- `product-loop`
- `retention`
- `ux`

Priority:
P0

Problem:
The workout completion flow confirms the session ended, but it does not strongly reinforce progress or clearly guide the user into the next meaningful action.

Proposed solution:
Rework the completion experience so it highlights why the workout mattered and presents one dominant next-step CTA with supporting secondary actions kept in a lower tier.

Scope:

- Rewarding summary content
- One dominant next-step CTA
- Secondary action hierarchy
- Progress-oriented recap framing

Acceptance criteria:

- Completion UI highlights meaningful recap items.
- One next-step CTA is visually dominant.
- The summary feels motivating rather than purely transactional.
- Secondary actions remain available without competing equally.

Suggested files:

- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/hooks/useWorkoutSession.ts`
- `src/pages/DashboardPage.tsx`

Test plan:

- E2E for complete workout -> completion modal -> next step
- Unit or integration tests for any summary helper logic

Dependencies:

- None

Definition of done:

- Completion flow feels directional and rewarding
- The main post-workout CTA is clear and test-covered

## P0 Issue 2

Title:
`[Feature] Add a weekly progress Dashboard module that reinforces return motivation`

Labels:

- `enhancement`
- `retention`
- `ux`
- `product-loop`

Priority:
P0

Problem:
Users do not consistently see a strong weekly progress narrative from the Dashboard, which weakens the habit loop after workouts are logged.

Proposed solution:
Add a weekly progress module that summarizes meaningful momentum without competing with the primary training CTA.

Scope:

- Weekly summary framing
- Dashboard placement and hierarchy
- Mobile-friendly glanceability
- Clear reinforcement copy

Acceptance criteria:

- Weekly progress is visible from the Dashboard.
- The module is understandable in one glance.
- The module supports retention without outranking the primary CTA.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/WeeklyRecapCard.tsx`
- helper files as needed

Test plan:

- Unit tests for weekly progress calculations
- Manual QA on mobile and desktop layouts

Dependencies:

- None

Definition of done:

- Weekly progress is visible, concise, and hierarchy-safe

## P1 Issue 3

Title:
`[Feature] Connect streak and mission reinforcement to the main Dashboard momentum story`

Labels:

- `enhancement`
- `retention`
- `ux`

Priority:
P1

Problem:
Streak and mission signals exist, but they do not consistently reinforce the user's current weekly momentum or return motivation.

Proposed solution:
Refine how streak and mission status appear on Dashboard so they support the main progress narrative instead of reading like disconnected widgets.

Scope:

- Streak reinforcement copy and placement
- Mission visibility in the retention loop
- Hierarchy alignment with weekly progress and primary CTA

Acceptance criteria:

- Streak and mission elements feel connected to the user's momentum.
- The page hierarchy remains readable.
- Reinforcement copy is concise and action-oriented.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/StreakDisplay.tsx`
- mission-related components as needed

Test plan:

- Manual QA for hierarchy and copy
- E2E spot checks when reinforcement appears

Dependencies:

- P0 Issue 2

Definition of done:

- Streak and mission signals support the same retention narrative

## P1 Issue 4

Title:
`[Feature] Turn insights into next-step recommendations instead of analysis-only output`

Labels:

- `enhancement`
- `retention`
- `ai`
- `product-loop`

Priority:
P1

Problem:
Insights are useful, but the retention loop is weaker when analysis does not lead to an actionable next step.

Proposed solution:
Add recommendation framing to insight outputs so users can understand what to do next without overclaiming certainty.

Scope:

- Recommendation framing in Insights
- Next-step wording tied to training context
- Light connection to subsequent training actions

Acceptance criteria:

- Insights include a clear follow-up action when appropriate.
- The action feels plausible and product-connected.
- The wording stays honest about uncertainty and context limits.

Suggested files:

- `src/pages/InsightsPage.tsx`
- insight rendering components or helpers
- adaptation-related logic if needed

Test plan:

- Component or integration tests for recommendation rendering
- Manual QA for recommendation clarity

Dependencies:

- P0 Issue 2 is helpful but not strictly required

Definition of done:

- Insights end in actionable guidance more often than passive analysis

## P1 Issue 5

Title:
`[Feature] Add retention analytics for post-workout and progress-module engagement`

Labels:

- `enhancement`
- `analytics`
- `retention`

Priority:
P1

Problem:
Sprint 3 will be hard to evaluate if the product cannot measure whether reinforcement modules are shown and acted on.

Proposed solution:
Add structured analytics for post-workout next-step engagement, weekly progress interaction, and insight recommendation follow-through.

Scope:

- Analytics wrapper additions
- Workout completion call sites
- Dashboard progress-module call sites
- Insight recommendation engagement call sites

Acceptance criteria:

- Retention surfaces emit structured events for shown and clicked interactions where appropriate.
- Event names align with existing analytics patterns.
- Payloads are clear enough for PM and QA review.

Suggested files:

- `src/lib/analytics.ts`
- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/InsightsPage.tsx`

Test plan:

- Unit tests for analytics helper behavior
- Manual QA note for expected event emission

Dependencies:

- P0 Issue 1
- P0 Issue 2

Definition of done:

- Sprint 3 retention changes are measurable
- Event contract is documented enough for downstream analysis