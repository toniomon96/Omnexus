# Sprint 1 QA Checklist

Use this checklist to manually verify Sprint 1 (Reliability and Release Confidence) before signoff.

## Sync and Save-State Trust

- Complete a workout and verify a visible save-state outcome is shown.
- Save-state language is explicit and user-facing (for example: saved locally, syncing, synced, or needs attention).
- If cloud sync is unavailable, a non-destructive recovery state is shown instead of silent failure.
- Most recent workout/history surfaces reflect the current sync-state outcome.

## Retry and Recovery

- A failed sync path offers a clear retry action.
- Retrying updates state immediately and does not duplicate session data.
- Repeated failures preserve local data and keep a visible needs-attention state.

## Guest-to-Account Trust

- Guest user sees clear device-only persistence messaging.
- Guest upgrade/create-account path is visible and understandable.
- Guest-to-account migration flow preserves trust-critical progress data.

## Auth and Hydration Resilience

- Auth/profile hydration failures show clear retry or refresh actions.
- App avoids silent loops or blank dead-end screens when hydration fails.
- Recovery behavior is understandable for both guest and authenticated users.

## CI and E2E Confidence

- Core deterministic release-signal paths are green in CI.
- Any non-deterministic or environment-constrained failures are documented with rationale.
- QA notes capture any known exceptions and owner follow-up.

## Signoff

- QA owner:
- Product owner:
- Release owner:
- Date:
- Notes:
