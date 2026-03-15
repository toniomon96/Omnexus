# Omnexus Documentation

This documentation tree is organized for long-term maintenance. Start here when you need the current product shape, engineering guidance, roadmap context, or historical records.

## Core Docs

| Area | Primary Docs |
|---|---|
| System context | [`architecture/system-overview.md`](architecture/system-overview.md), [`architecture/architecture-overview.md`](architecture/architecture-overview.md) |
| Product behavior | [`product/core-features.md`](product/core-features.md), [`product/user-flows.md`](product/user-flows.md), [`product/v1-scope.md`](product/v1-scope.md) |
| Engineering setup | [`engineering/development-guide.md`](engineering/development-guide.md), [`engineering/api-reference.md`](engineering/api-reference.md), [`engineering/release-strategy.md`](engineering/release-strategy.md) |
| Roadmap | [`roadmap/future-roadmap.md`](roadmap/future-roadmap.md), [`roadmap/planned-features.md`](roadmap/planned-features.md) |
| Audit output | [`audit/codebase-health-report.md`](audit/codebase-health-report.md), [`audit/documentation-status-report.md`](audit/documentation-status-report.md), [`audit/documentation-vs-implementation-report.md`](audit/documentation-vs-implementation-report.md), [`audit/v1-release-readiness-audit-2026-03-15.md`](audit/v1-release-readiness-audit-2026-03-15.md) |
| Historical records | [`archive/README.md`](archive/README.md) |

## Folder Guide

```text
docs/
├── architecture/   System context, frontend/API/AI architecture
├── audit/          Point-in-time audits, metrics, and validation reports
├── engineering/    Local setup, API reference, release, CI, environment docs
├── features/       Deep dives for implemented product systems
├── product/        Product overview, core features, user flows, V1 scope
├── roadmap/        Planned work and go-to-market strategy
├── archive/        Completed plans, sprint artifacts, historical reports
├── migrations/     SQL migrations
└── wiki/           Legacy GitHub wiki mirror (currently stale; audit tracked)
```

## Maintenance Rules

- Keep active documentation in `architecture/`, `engineering/`, `features/`, `product/`, and `roadmap/`.
- Move completed plans, release records, and one-off reports into `archive/` or `audit/` instead of deleting them.
- Treat `wiki/` as a legacy mirror until it is refreshed.
- Update this index when adding a new top-level documentation area.
