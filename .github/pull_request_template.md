## Summary

<!-- What does this PR do? -->

## Promotion Path

- [ ] `feature/*`, `bug/*`, `fix/*`, `chore/*`, or `docs/*` branch targeting `dev`
- [ ] `dev -> main` release candidate targeting production
- [ ] `hotfix/* -> main` urgent production patch

## Environment Validation

- [ ] Local verification completed: `npm run verify:local`
- [ ] Dev smoke gate completed for changes headed to `dev`: `npm run verify:dev`
- [ ] Preview release gate completed for changes headed to `main`: `npm run verify:preview`
- [ ] Preview deployment reviewed manually before production merge

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] Tests

## Checklist

- [ ] Target branch follows `local -> dev -> preview -> prod`
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm test` passes (all tests green)
- [ ] `npm run build` passes
- [ ] No API keys or secrets added to source files
- [ ] New serverless endpoints call `setCorsHeaders()` and `checkRateLimit()`
