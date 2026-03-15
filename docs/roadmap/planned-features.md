# Planned Features

This document tracks roadmap and plan items that are documented but not fully implemented in the current codebase.

## Partially Implemented

| Feature | Status | Evidence |
|---|---|---|
| Wearables integration | Partial | `src/lib/health.ts` and `HealthWidget` provide scaffolding, but full HealthKit / Health Connect integration is deferred |
| Meal plan generation | Partial | `api/meal-plan.ts` exists, but there is no corresponding surfaced product flow in the main UI |
| GitHub wiki mirror | Partial | `docs/wiki/` exists, but several pages are stale and diverge from the current codebase |

## Planned, Not Yet Implemented

| Feature | Source Docs |
|---|---|
| Full App Store / Play Store submission workflow | `roadmap/future-roadmap.md`, `roadmap/market-expansion-plan.md` |
| PDF export for programs and workout history | `roadmap/future-roadmap.md` |
| Interactive exercise animations and richer lesson media | `roadmap/future-roadmap.md` |
| AI form coach / computer vision | `roadmap/future-roadmap.md` |
| Offline-first sync architecture | `roadmap/future-roadmap.md` |
| Full wearables data ingestion and recovery scoring | `roadmap/future-roadmap.md` |
| B2B gym licensing, multi-tenancy, and trainer tools | `roadmap/future-roadmap.md`, `roadmap/market-expansion-plan.md` |
| Employer wellness distribution and frontline-worker track | `roadmap/market-expansion-plan.md` |
| Body Transformation Timeline as a roadmap-level retention artifact | `roadmap/market-expansion-plan.md` (note: a timeline page exists today, but not the broader roadmap vision described there) |

## Documentation Handling

- Keep strategy and roadmap docs in `docs/roadmap/`.
- Do not archive these until the work is shipped or formally cancelled.
- When a planned item is implemented, move the product explanation into `docs/product/` or `docs/features/` and update this file.
