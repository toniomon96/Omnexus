# Sprint 3 QA Checklist

Use this checklist to manually verify Sprint 3 (Motivation and Retention) before signoff.

## Workout Completion

- Completing a workout opens a recap-focused completion modal.
- The modal shows one dominant `Next step` action with lower-priority utility actions beneath.
- The dominant next step changes by context:
  - Quick Session: routes toward History.
  - Program workout: routes toward Dashboard.
  - Adaptation available: points to Next Session guidance.
- Completion still shows save-state status and does not regress sync messaging.

## Dashboard Weekly Momentum

- Weekly progress module appears when completed workout history exists.
- Weekly module shows:
  - Weekly session progress toward goal
  - Meaningful weekly summary metrics
  - One clear primary follow-up action
- Weekly module primary action routes correctly:
  - Under goal: toward Train
  - Goal met: toward Insights

## Streak and Mission Reinforcement

- Dashboard shows a momentum focus block that references streak continuity.
- For authenticated users with active program missions, mission progress appears in the same momentum block.
- Momentum block has one clear action CTA and does not outrank the primary training CTA.

## Insights to Action

- Insights page shows a `Recommended next step` card.
- Recommendation changes based on user/context:
  - Guest: account-oriented next step
  - No history: start training next
  - History + no analysis yet: training/history progression step
  - Post-analysis: focused Ask follow-up step
- Recommendation CTA routes correctly and does not break existing Ask quick-question behavior.

## Analytics and Instrumentation

- `weekly_progress_module_event` fires for shown and clicked states.
- `workout_completion_next_step_event` fires for shown and clicked states.
- `insight_recommendation_event` fires for shown and clicked states.
- Existing Sprint 2 dominant CTA analytics remain intact.

## Regression Checks

- Dashboard primary CTA hierarchy from Sprint 2 remains intact.
- Guest persistence messaging still appears on key guest surfaces.
- Quick Session route and onboarding copy remain stable.
- Insights guest/auth gating behavior remains correct.

## Test Coverage Notes

- Updated unit coverage in `src/lib/analytics.test.ts` covers new Sprint 3 analytics events.
- Updated E2E checks cover:
  - Weekly progress module presence and primary action hook
  - Momentum focus card visibility
  - Insights recommended-next-step block visibility