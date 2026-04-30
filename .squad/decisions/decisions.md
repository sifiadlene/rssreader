# Decisions Log

## Decision: Enable flat ESLint for TypeScript

**Date:** 2026-04-30T00:26:03.781+00:00
**Author:** Spike
**Status:** Accepted
**Scope:** Repository lint workflow

### Context
The repository ships an `npm run lint` script, but ESLint 9 requires a flat config and the project did not yet include TypeScript-aware ESLint support. That blocked validation of the new backend TypeScript foundation.

### Decision
Adopt `eslint.config.js` at the repository root and add `typescript-eslint` so the existing lint script can run against `src/` TypeScript files without changing the team-facing command.

### Consequences
- `npm run lint` is now part of the working validation loop for backend and client TypeScript changes.
- Future lint rules should be added in the flat config rather than legacy `.eslintrc` files.

---

## Decision: Frontend API normalization

**Date:** 2026-04-30T00:26:03.781+00:00
**Author:** Faye
**Status:** Accepted
**Requested by:** Adlene

### Context
The frontend needed to ship before the backend payload format was fully implemented, while still consuming the shared `Feed` and `Article` models from `src/shared/types/`.

### Decision
The client uses camelCase shared interfaces in `src/shared/types/index.ts`, and `src/client/services/api.ts` normalizes both camelCase and snake_case API payloads into those interfaces.

### Impact
Backend responses can evolve without breaking the initial UI, as long as they include the documented fields for feeds and articles.

---

## Decision: Testing Contracts for Base Implementation

**Date:** 2026-04-30T00:26:03.781+00:00
**Author:** Ed
**Status:** Accepted

### Context
The repo had architecture only, so the initial test suite needed to define implementation targets for both client and server while remaining runnable under Vitest.

### Proposed Decision
- Keep the base test split under `src/server/__tests__/` and `src/client/__tests__/`.
- Use `vitest.config.ts` with `environmentMatchGlobs` so backend tests run in `node` and frontend tests run in `jsdom`.
- Treat these paths as the initial implementation contract:
  - `src/server/database.ts`
  - `src/server/models/feedModel.ts`
  - `src/server/models/articleModel.ts`
  - `src/server/services/feedService.ts`
  - `src/server/app.ts`
  - `src/client/services/api.ts`
  - `src/client/components/Header.tsx`
  - `src/client/components/FeedCard.tsx`
  - `src/client/components/ArticleItem.tsx`

### Consequences
Implementers can build against stable test targets immediately, and the suite can grow without reorganizing the contract surface later.

---

## Decision: Improvement Audit Priority Roadmap

**Date:** 2026-04-30
**Author:** Jet
**Status:** Proposed for team review

### Context
Full architectural and code quality audit requested by Adlene identified critical improvements across security, data integrity, product completeness, and developer experience.

### Recommended Priority Order

1. **P0 Security first**
   - Replace permissive `cors()` with explicit origin allowlist.
   - Add centralized URL sanitization/validation for all feed, article, site, and image URLs.
   - Add SSRF protections in feed fetch/discovery: only `http:`/`https:`, reject localhost/private IPs, stop following unsafe redirects, and add regression tests.
   - Add request body size limits and security headers (`helmet`).

2. **P1 Data integrity and architecture cleanup**
   - Fix `createArticle` duplicate path (`INSERT OR IGNORE` + `lastInsertRowid`).
   - Wrap subscribe/create race paths and unique-constraint cases in explicit domain errors.
   - Route backend reads/writes consistently through the service layer instead of mixing routes with models.
   - Remove `Record<string, unknown>` dynamic fallbacks in `feedService` and restore typed imports.

3. **P2 Product and UX completeness**
   - Expose unsubscribe and mark-as-read in the UI and API.
   - Add request cancellation for feed/detail/search hooks and clearer stale-data handling.
   - Add pagination / incremental loading for feeds with large article histories.
   - Add schema validation for API payloads on both server and client normalization boundaries.

4. **P3 Developer experience**
   - Add CI for `npm run lint`, `npm test`, `npm run build`, and dependency/security checks.
   - Split the monolithic stylesheet if frontend scope keeps growing.
   - Update `docs/architecture.md` so it no longer advertises unimplemented capabilities like interval refresh and mark-as-read routes.

---
