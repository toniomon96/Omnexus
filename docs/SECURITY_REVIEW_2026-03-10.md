# Omnexus Security Review (2026-03-10)

## Critical Findings

- None confirmed in current code pass.

## High Findings

- Password policy was too weak (6-character minimum). Updated to 12-character minimum for account creation and password updates.
- Brute-force controls at sign-in were insufficient. Added server-mediated `/api/signin` with IP rate limiting plus per-account hash-based lockout after repeated failures.

## Medium Findings

- HTTPS enforcement was implicit via hosting but not explicit in API helper. Added rejection for insecure forwarded protocol and enabled HSTS headers in production responses.
- API security hardening headers were incomplete. Added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` defaults.

## Existing Strengths

- Supabase Auth handles password hashing and secure credential storage.
- Service-role credentials stay server-side in Vercel functions.
- Endpoint rate limiting exists and now supports per-route limits.
- CORS allowlist enforcement is strict in preview/production.

## Required Manual Platform Controls Before Launch

- Enable Supabase MFA enforcement for privileged/admin users (or all staff accounts).
- Ensure all production traffic is HTTPS only at edge and custom domains.
- Confirm data encryption at rest in Supabase and any external stores; rotate secrets and set least-privilege access.
- Run independent vulnerability assessment and penetration test (authenticated and unauthenticated).
- Configure alerting for repeated lockouts, auth anomalies, and unusual API error-rate spikes.

## Deferred For Later (User Requested)

- Manual MFA rollout and enforcement changes.
- External vulnerability assessment and penetration testing engagement.
- Final production security operations checklist execution.

## Migration and Env Requirements

- Migration status: completed manually on 2026-03-10.
  - `docs/migrations/010_notification_events.sql`
  - `docs/migrations/011_auth_security_controls.sql`
- Set env vars for auth/server routes:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `AUTH_ATTEMPT_PEPPER` (recommended explicit secret for email-hash lockout keys)

External platform follow-through is tracked in `docs/PLATFORM_SECURITY_OPS.md`.
