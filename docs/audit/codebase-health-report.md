# Codebase Health Report

## Strengths

- **Strong baseline validation**: `npm run lint`, `npm run build`, and `npm test -- --run` all pass; the repo currently has 578 passing unit tests.
- **Consistent typed stack**: React, TypeScript, and typed Supabase helpers keep most domain data explicit.
- **Clear product-area segmentation**: the app is easy to navigate by domain because pages, components, and feature docs mostly align.
- **Mature backend hardening patterns**: shared CORS, rate limiting, prompt-safety helpers, and localized route tests reduce repeated security work.
- **Thoughtful failure handling**: route handlers usually fail with explicit status codes, and the frontend includes degraded states, toasts, and error boundaries.

## Weaknesses

- **Very large source files** increase maintenance risk: `src/data/courses.ts`, `src/lib/db.ts`, `src/pages/ProfilePage.tsx`, `src/pages/NutritionPage.tsx`, `src/pages/AskPage.tsx`, and `src/components/workout/WorkoutCompleteModal.tsx` each carry multiple responsibilities.
- **State is split across context, Supabase, and localStorage** with many direct localStorage reads throughout the app, making ownership harder to reason about.
- **Route and domain logic are concentrated** in `src/router.tsx` and `src/lib/db.ts`, which makes safe refactoring slower.
- **Documentation had drifted** in key entry points such as `README.md` and the wiki mirror before this audit.
- **Static content is bundled heavily**: the course catalog and exercise data are large client assets, which limits flexibility and contributes to bundle weight.

## Improvement Opportunities

- Split mega-modules by domain boundaries (`db`, router guards, large pages, large modals).
- Reduce direct localStorage usage outside shared helpers to clarify source-of-truth rules.
- Move the legacy wiki mirror behind an explicit refresh process or retire it to avoid future drift.
- Tighten active-document maintenance so test counts, doc paths, and release status stay current.
- Revisit bundle strategy for large static datasets, especially course content and exercise catalogs.

## Architecture Assessment

### Folder Structure Health

The overall folder structure is healthy at the top level: `src/`, `api/`, `docs/`, and `tests/` are easy to understand. The main issue is not where code lives, but how much logic accumulates in a small number of files inside those folders.

### Modularity and Separation of Concerns

The codebase uses sensible domain folders, but several modules act as catch-alls. `src/lib/db.ts`, `src/router.tsx`, and some page-level components mix orchestration, transformation, and persistence concerns that would scale better as smaller domain modules.

### Dependency Flow

The primary dependency direction is reasonable: pages depend on components/hooks/lib, and API handlers depend on shared helpers. The biggest exception is the breadth of direct localStorage and app-state interactions, which makes some flows feel cross-cutting instead of layered.

### State Management Clarity

The chosen stack is understandable: Auth context, App context, Toast context, plus route-level state. Clarity drops where guest-mode persistence, server hydration, and optimistic updates overlap.

## Security Assessment

### Positive Patterns

- Production/preview origin allowlists are centralized in `api/_cors.ts`.
- Rate limiting is centralized in `api/_rateLimit.ts` and fails closed in production when config is missing.
- Browser code uses `VITE_*` variables while sensitive provider keys stay server-side.
- Prompt-safety checks exist for AI-facing text inputs.

### Risks to Watch

- Large AI endpoints remain the most likely place for inconsistent request validation to creep in.
- The codebase depends on environment configuration for several critical controls; missing platform configuration still causes operational risk even when code is defensive.
- The build warning around `src/utils/localStorage.ts` suggests an avoidable chunking inconsistency that should be cleaned up before larger performance work.

## Performance Assessment

- The app already lazy-loads many route screens, which is a strong baseline.
- The heaviest client assets are static data bundles (`course-data` and `exercise-data`), not rendering loops.
- Large page components and large modal components increase re-render and memoization complexity.
- Some heavy calculations still live directly in page components instead of isolated selectors or loaders.

## Stability Assessment

- Error boundaries exist at both app and router levels.
- AI routes and service wrappers usually return actionable fallback errors.
- Guest-to-account and auth hydration flows are intentionally defensive, but they are also among the most complex code paths in the app.
- The biggest stability risks are concentrated complexity and documentation drift rather than obvious missing error handling.

## Notable Files to Watch

| File | Why it matters |
|---|---|
| `src/lib/db.ts` | Central data layer, very large, high blast radius |
| `src/router.tsx` | Route map, auth guards, hydration, migration flow |
| `src/pages/ProfilePage.tsx` | Large page with multiple profile concerns |
| `src/pages/NutritionPage.tsx` | Large page with dense UI and state logic |
| `src/pages/AskPage.tsx` | Dense conversational orchestration and UI state |
| `src/components/workout/WorkoutCompleteModal.tsx` | Large modal mixing summary, sync, and celebration concerns |
| `api/ask.ts` | Large AI route with broad surface area |
