# Sprint 2 QA Checklist

Use this checklist to manually verify the Core Loop Clarity sprint before signoff.

## Dashboard

- Guest with active program lands on Dashboard and sees one dominant primary CTA: `Start Workout`.
- User with active session lands on Dashboard and sees `Resume Workout` as the dominant CTA.
- While an active session exists, optional discovery sections such as `Explore later` are not shown above the fold.
- Guest without a program sees `Browse Programs` as the primary CTA and `Quick Session` as the secondary fast path.
- Dashboard still exposes supporting tools without making them feel equal to the primary training action.

## Train

- Active session state shows `Resume Workout` as the only primary training action.
- Active program state shows `Start Workout` as the primary action and `Quick Session` as the secondary option.
- No-program state shows `Browse Programs` as the primary action and `Quick Session` as the secondary option.
- Train copy describes the fast path consistently as `Quick Session`.

## Language Consistency

- Help uses `Start Workout`, `Browse Programs`, `Resume Workout`, and `Quick Session` consistently.
- The Quick Session page title and helper copy use `Quick Session`.
- Guided pathways and onboarding do not reintroduce `Quick Log` language for the workout fast path.

## Analytics

- Dashboard emits `primary_training_action_event` for `shown` and `clicked` with the expected state.
- Train emits `primary_training_action_event` for `shown` and `clicked` with the expected state.
- No-program flows distinguish `browse_programs` from the Quick Session alternative in behavior and copy.

## Regression Checks

- Dashboard guest persistence CTA is still visible for guest users.
- Guest no-program path still reaches Programs from Dashboard and Quick Session from both Dashboard and Train.
- Workout start from Dashboard still reaches briefing or active workout correctly.
- Existing golden-path E2E scenarios for Dashboard and workout flows still pass.