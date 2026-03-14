# Omnexus Sprint 3 Backlog

Sprint name: Motivation and Retention

Recommended duration: 2 weeks

Primary objective:
Connect completed workouts to visible progress, motivating feedback, and the next meaningful action so users feel momentum instead of closure only.

## Sprint Status

Prerequisite:
Sprint 2 implementation is complete in the repo, with manual QA and release-owner signoff still owned by release execution.

Current status:

- Implementation complete in repo as of 2026-03-12.
- Story 1.1 is implemented: workout completion now emphasizes momentum recap and a dominant next step.
- Story 2.1 is implemented: weekly progress module includes goal framing and a clear follow-up CTA.
- Story 2.2 is implemented: Dashboard includes an explicit momentum focus block that reinforces streak continuity and mission progress in one place.
- Story 3.1 is implemented: Insights includes a recommended next-step block tied to history and analysis state.
- Story 3.2 is implemented: retention analytics track weekly progress engagement, workout completion next-step engagement, and insights recommendation engagement.
- Manual QA and release-owner verification are the remaining signoff tasks.

## Sprint Goal

By the end of Sprint 3:

- Workout completion feels rewarding and directional instead of merely transactional.
- Dashboard makes weekly progress visible enough to reinforce return behavior.
- Insights feel connected to the next workout rather than isolated analysis.
- Missions, streaks, and progress signals reinforce each other instead of reading like separate systems.

## Sprint Success Metrics

- More completed-workout users continue into a next action from the completion flow.
- Weekly progress content is visible from Dashboard without extra digging.
- Insight surfaces recommend a clear next step after analysis.
- Users have at least one obvious reason to come back this week.

## Sprint Scope Guardrails

In scope:

- Workout Complete summary and next-step hierarchy
- Dashboard weekly progress framing
- Insight-to-action connection
- Mission and streak visibility reinforcement tied to retention
- Analytics and tests required to validate these changes

Out of scope:

- Broad Dashboard redesign unrelated to retention
- New AI feature expansion outside insight framing
- Deep gamification system expansion
- Large community feature additions

## Epic 1: Post-Workout Reinforcement

Goal:
Turn workout completion into a motivating recap that points clearly to the next action.

### Story 1.1: Redesign Workout Complete summary around progress and next step

Problem:
The completion experience currently confirms the workout ended, but does not strongly reinforce progress or suggest what to do next.

User story:
As a user, I want workout completion to show why the session mattered and what I should do next so I feel momentum instead of a dead stop.

Acceptance criteria:

- The completion UI highlights meaningful recap items such as duration, volume, PRs, or consistency progress.
- The completion UI includes one dominant next-step CTA.
- The next-step CTA feels connected to the user's current state, not generic.
- The summary feels rewarding without becoming noisy or overlong.

Suggested files:

- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/hooks/useWorkoutSession.ts`
- `src/pages/DashboardPage.tsx`

Test plan:

- E2E for complete workout -> completion modal -> next action
- Unit coverage for any new progress-summary helper logic

Labels:

- `product-loop`
- `retention`
- `ux`

### Story 1.2: Make post-workout next-step routing state-aware

Problem:
Users can complete a workout and then lose context about whether they should return to Dashboard, review History, or continue training guidance.

User story:
As a user, I want the completion flow to send me toward the most useful next action based on my context.

Acceptance criteria:

- The completion experience offers a dominant next step tied to current context.
- Secondary completion actions remain available without competing equally.
- The flow avoids a dead-end feel after save confirmation.

Suggested files:

- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/lib/analytics.ts`
- `src/pages/HistoryPage.tsx`

Test plan:

- E2E for complete workout -> CTA follow-through
- Manual QA for guest and program-based flows

Labels:

- `product-loop`
- `retention`

## Epic 2: Dashboard Weekly Momentum

Goal:
Make weekly progress visible and actionable from the Dashboard.

### Story 2.1: Add a weekly progress module that reinforces momentum

Problem:
Users may finish workouts without seeing cumulative weekly progress, which weakens retention and return motivation.

User story:
As a user, I want to see how my week is going so I have a reason to return and continue.

Acceptance criteria:

- Dashboard includes a weekly progress module with meaningful summary data.
- The module emphasizes progress, not raw data dump.
- The module remains understandable on mobile widths.
- The module does not outrank the core training CTA.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/WeeklyRecapCard.tsx`
- new helper or selector files as needed

Test plan:

- Unit tests for weekly progress calculations
- Manual QA for mobile layout and glanceability

Labels:

- `retention`
- `ux`
- `product-loop`

### Story 2.2: Surface streak and mission reinforcement more intentionally

Problem:
Streaks and missions exist, but the app does not consistently tie them into the main retention loop.

User story:
As a user, I want streaks and missions to feel like reinforcement for the work I already did, not disconnected widgets.

Acceptance criteria:

- Dashboard better connects streak and mission signals to current momentum.
- Reinforcement copy is concise and action-oriented.
- Supporting progress modules do not overwhelm the page hierarchy.

Suggested files:

- `src/pages/DashboardPage.tsx`
- `src/components/dashboard/StreakDisplay.tsx`
- mission-related dashboard components or services as needed

Test plan:

- Manual QA on Dashboard hierarchy
- E2E spot checks where mission or streak reinforcement is expected

Labels:

- `retention`
- `ux`

## Epic 3: Insight-to-Action Continuity

Goal:
Make insights recommend the next action rather than ending at analysis.

### Story 3.1: Link insights to a next workout recommendation or follow-up action

Problem:
Insight surfaces can be useful, but they are less sticky if they end at interpretation rather than guidance.

User story:
As a user, I want insights to suggest what to do next so analysis changes my behavior.

Acceptance criteria:

- Insight framing includes a next-step recommendation when appropriate.
- The recommendation feels connected to the training loop.
- The action does not overpromise precision beyond available data.

Suggested files:

- `src/pages/InsightsPage.tsx`
- insight rendering components or helpers
- adaptation-related logic if needed

Test plan:

- Manual QA for recommendation clarity
- Integration or component tests for recommendation rendering logic

Labels:

- `retention`
- `ai`
- `product-loop`

### Story 3.2: Add retention analytics for progress-module and next-step engagement

Problem:
Sprint 3 cannot be evaluated well if the product does not measure whether reinforcement modules are seen and acted on.

User story:
As the team, we want to measure whether Sprint 3 changes post-workout and Dashboard engagement behavior.

Acceptance criteria:

- Progress-module engagement is measurable.
- Post-workout next-step actions are measurable.
- Event names align with the existing analytics conventions.

Suggested files:

- `src/lib/analytics.ts`
- `src/components/workout/WorkoutCompleteModal.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/InsightsPage.tsx`

Test plan:

- Unit tests for analytics helper wrappers
- Manual QA note for expected events

Labels:

- `analytics`
- `retention`

## Sprint Dependency Order

Recommended implementation order:

1. Story 1.1
2. Story 1.2
3. Story 2.1
4. Story 2.2
5. Story 3.1
6. Story 3.2

Rationale:

- Start by strengthening the post-workout loop where user intent is freshest.
- Then reinforce the Dashboard with weekly momentum before connecting insights more tightly.
- Add measurement once the new retention surfaces are stable enough to instrument.

## Suggested Sprint Board Columns

- Ready
- In progress
- In review
- QA
- Done

## Suggested Owner Split

- Frontend owner: Stories 1.1, 1.2, 2.1, 2.2, 3.1
- Platform/analytics owner: Story 3.2
- Product/design owner: acceptance review for Sprint 3 reinforcement hierarchy and copy
- QA/release owner: regression review for post-workout and Dashboard journeys

## Sprint Review Demo Script

Demo these journeys in order:

1. User completes a workout and sees a rewarding summary plus one clear next step
2. Completion CTA leads to a useful follow-up instead of a dead-end
3. Dashboard shows a weekly progress module that reinforces return motivation
4. Streak and mission signals feel connected to the week's momentum
5. Insights recommend a plausible next action instead of analysis only

## Definition of Done for Sprint 3

Sprint 3 is complete only when:

- Workout completion reinforces progress and points to a next action.
- Dashboard shows weekly progress without weakening the primary workout path.
- Insights visibly influence subsequent product actions.
- Retention-oriented engagement is measurable.

Related execution docs:

- [Sprint 3 issue drafts](SPRINT_3_ISSUE_DRAFTS.md)
- [Sprint 3 QA checklist](SPRINT_3_QA_CHECKLIST.md)