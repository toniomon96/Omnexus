# Platform Security Ops Checklist

This runbook tracks the remaining platform and security operations outside normal code edits.

## Status Snapshot (2026-03-10)

- Database migrations: completed manually
  - `docs/migrations/010_notification_events.sql`
  - `docs/migrations/011_auth_security_controls.sql`
- In-repo auth and notification hardening: completed
- Remaining items below are platform/external operations
- Product decision: external security operations are intentionally deferred for now; keep tracker current and revisit before release sign-off

## Execution Tracker

Use this as the source of truth while finishing launch security ops.

| Item | Owner | Status | Target Date | Evidence Link/Note |
|---|---|---|---|---|
| Supabase MFA enforced for admin/staff accounts | Platform admin | Pending |  |  |
| HTTPS/TLS and redirect verification complete | Platform admin | Pending |  |  |
| Secret rotation complete (`service-role`, Stripe, Resend, OpenAI, Anthropic, `AUTH_ATTEMPT_PEPPER`) | Platform admin | Pending |  |  |
| Auth lockout and 401/429 monitoring alerts configured | Platform admin | Pending |  |  |
| Notification failure alerting (`notification_events`) configured | Platform admin | Pending |  |  |
| External VA/PT completed and report received | Security lead | Pending |  |  |
| VA/PT remediation and retest complete | Engineering + Security | Pending |  |  |
| Final release security sign-off recorded | Engineering + Security | Pending |  |  |

Status values: `Pending`, `In Progress`, `Blocked`, `Done`.

## 1. Supabase MFA (Admin/Staff)

Owner: Platform admin

- Enable MFA requirement for all privileged/admin accounts in Supabase Auth settings.
- Require enrollment for current admin users.
- Keep at least one break-glass account with a separate hardware-backed factor.
- Record recovery process and where backup codes are stored.

Evidence to capture:

- Screenshot/export of MFA enforcement settings.
- List of admin users with MFA enrolled.

## 2. HTTPS/TLS Enforcement

Owner: Platform admin

- Confirm Vercel domains force HTTPS.
- Confirm apex and www redirects are consistent.
- Confirm HSTS is present in production API responses.

Evidence to capture:

- Browser/network capture showing HTTPS-only redirects.
- Header capture with `Strict-Transport-Security`.

## 3. Encryption and Secret Hygiene

Owner: Platform admin

- Confirm Supabase encryption at rest is active (managed default).
- Verify no plaintext secrets in repo, CI logs, or client bundles.
- Rotate high-impact secrets before launch:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `RESEND_API_KEY`
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `AUTH_ATTEMPT_PEPPER`

Evidence to capture:

- Secret rotation date + owner.
- Updated environment matrix version/date.

## 4. Brute-Force and Lockout Monitoring

Owner: Platform admin

- Set alerts on repeated lockouts and 401/429 spikes for `/api/signin`.
- Track abnormal notification failures by querying `notification_events`.
- Add weekly review for lockout and failed-login trends.

Evidence to capture:

- Alert policy IDs and notification destinations.
- Weekly report link or dashboard screenshot.

## 5. Vulnerability Assessment and Penetration Test

Owner: Security lead

- Run unauthenticated web/API assessment.
- Run authenticated test with user and admin-equivalent accounts.
- Include auth flows, reset flows, CORS, rate-limit bypass attempts, and API abuse scenarios.
- Log findings with severity and remediation deadlines.

Evidence to capture:

- VA/PT report and retest confirmation.
- Risk acceptance records for any deferred issues.

## 6. Release Sign-Off Gate

Owner: Engineering + Security

- Confirm all checklist sections are complete.
- Confirm no unresolved critical/high findings.
- Confirm incident response contacts are documented.

Sign-off template:

- Date:
- Engineering approver:
- Security approver:
- Notes:

## Completion Criteria

- All tracker rows are `Done`.
- No open critical/high vulnerabilities without documented risk acceptance.
- Sign-off fields are completed and linked in release PR.
