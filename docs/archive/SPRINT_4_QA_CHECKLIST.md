# Sprint 4 QA Checklist

Scope:
AI quality and product cohesion across Ask, Insights, and AI Program Generation.

## Preflight

- Pull latest branch and install dependencies.
- Confirm env vars for AI endpoints are configured.
- Run local gates: lint, typecheck, unit tests.

## Ask Page

- Submit a normal question and confirm streamed response renders.
- Trigger network failure and verify fallback copy is clear and non-technical.
- Trigger free-tier daily-limit and verify upgrade prompt appears.
- Retry after transient error and verify successful recovery path.

## Insights Page

- For signed-in user with history: analyze successfully and confirm result renders.
- For signed-in user without recent history: confirm explanatory no-data state.
- Trigger network/service failure and confirm standardized fallback messaging.
- Retry after failure and verify request can recover.

## AI Program Generation Page

- Load generation context successfully and verify profile summary.
- Trigger generation error and confirm standardized fallback messaging.
- Verify loading and generating states are clear and not contradictory.

## Cross-Surface Consistency

- Compare error language patterns across Ask, Insights, and Program Generation.
- Confirm retry affordance is understandable in all three surfaces.
- Confirm no fallback state blocks navigation to other core loop pages.

## Analytics Validation

- Verify AI request submit events fire as expected.
- Validate fallback/retry/recovery events once implemented.
- Confirm payload surface labels match page context.

## Signoff

- QA owner:
- Product owner:
- Release owner:
- Date:
- Notes:
