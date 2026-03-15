# Codebase Metrics

Date: 2026-03-15

## Counting Rules

- Counts are physical line counts, not code/comment/blank-separated LOC.
- Only tracked files from `git ls-files` are counted.
- Generated report folders are excluded: `coverage/`, `playwright-report/`, `test-results/`.
- Text/code extensions counted in the broad scope: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.css`, `.scss`, `.sass`, `.html`, `.md`, `.yml`, `.yaml`, `.sql`, `.sh`, `.ps1`, `.java`, `.kt`, `.swift`, `.xml`, `.gradle`, `.properties`.

## Summary

| Scope | Files | Lines |
| --- | ---: | ---: |
| Broad tracked text/code scope | 463 | 86,355 |
| Source-only scope | 370 | 65,737 |

The source-only scope is restricted to `api/`, `src/`, `tests/`, `scripts/`, `landing/`, `android/`, `ios/`, and `public/`, and excludes docs plus root-level config/documentation files.

## Folder Breakdown

Broad tracked text/code scope.

| Folder | Files | Lines |
| --- | ---: | ---: |
| `src` | 246 | 51,351 |
| `api` | 75 | 11,203 |
| `docs` | 67 | 10,916 |
| `[root]` | 14 | 9,136 |
| `tests` | 22 | 2,264 |
| `.github` | 7 | 496 |
| `android` | 21 | 476 |
| `landing` | 2 | 340 |
| `ios` | 7 | 117 |
| `public` | 2 | 56 |

## Language Breakdown

Broad tracked text/code scope.

| Language | Files | Lines |
| --- | ---: | ---: |
| TypeScript | 213 | 41,646 |
| TSX | 133 | 23,214 |
| Markdown | 64 | 11,151 |
| JSON | 10 | 8,584 |
| YAML | 4 | 415 |
| HTML | 2 | 354 |
| XML | 11 | 301 |
| SQL | 9 | 281 |
| Gradle | 6 | 121 |
| CSS | 1 | 88 |
| Swift | 3 | 71 |
| JavaScript | 2 | 67 |
| Java | 3 | 38 |
| Properties | 2 | 24 |

## Additional Breakdowns

All sections below use the source-only scope so the numbers reconcile to 65,737 lines.

### App Code vs Tests

Test code is defined as files under `tests/`, files under any `__tests__/` directory, and files matching `*.test.*` or `*.spec.*`.

| Category | Files | Lines |
| --- | ---: | ---: |
| App code | 281 | 54,059 |
| Test code | 89 | 11,678 |

### Frontend vs Backend

Frontend is defined as `src/`, `landing/`, and `public/`. Backend is `api/`. Everything else inside the source-only scope is grouped as supporting code.

| Category | Files | Lines |
| --- | ---: | ---: |
| Frontend | 249 | 51,723 |
| Backend | 75 | 11,203 |
| Supporting | 46 | 2,811 |

### Top 20 Largest Source Files

Source-only scope, sorted by physical line count descending.

| File | Lines |
| --- | ---: |
| `src/data/courses.ts` | 4,439 |
| `src/data/exercises/barbell.ts` | 1,644 |
| `src/data/exercises/cable.ts` | 1,358 |
| `src/lib/db.ts` | 1,277 |
| `src/data/exercises/legacy.ts` | 1,127 |
| `src/data/exercises/bodyweight.ts` | 1,062 |
| `src/pages/ProfilePage.tsx` | 1,053 |
| `src/data/exercises/machine.ts` | 1,005 |
| `api/generate-program.ts` | 909 |
| `src/pages/NutritionPage.tsx` | 841 |
| `src/types/index.ts` | 839 |
| `src/pages/AskPage.tsx` | 820 |
| `src/data/exercises/kettlebell.ts` | 779 |
| `src/data/exercises/dumbbell.ts` | 732 |
| `src/data/exercises/mobility.ts` | 665 |
| `src/components/workout/WorkoutCompleteModal.tsx` | 646 |
| `src/pages/DashboardPage.tsx` | 638 |
| `src/pages/ExerciseDetailPage.tsx` | 632 |
| `src/data/exercises/resistance-band.ts` | 630 |
| `src/router.tsx` | 614 |