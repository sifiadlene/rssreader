# Squad Decisions

## Active Decisions

### Decision: Architecture Foundation

**Date:** 2026-04-30
**Author:** Jet (Lead)
**Status:** Accepted
**Scope:** Full project architecture

#### Context
Adlene requested the initial architecture definition for the RSS Reader application. The app must support searching, adding, viewing summaries, and storing RSS feeds.

#### Decisions

1. **Monorepo with single package.json** — Shared TypeScript types between client and server, single `npm install`, simpler CI.

2. **React 18 + Vite frontend** — Fast HMR, native TypeScript, modern build tooling. No Create React App.

3. **Express 4 backend** — Lightweight, well-known, sufficient for REST API serving feeds and articles.

4. **SQLite via better-sqlite3** — Zero-config file-based database. Synchronous API avoids callback complexity. Easy migration path to PostgreSQL if needed later.

5. **rss-parser for RSS fetching** — Server-side only. Handles RSS 2.0, Atom, RDF. Avoids CORS issues that client-side fetching would create.

6. **No ORM** — Raw SQL queries. The schema (2 tables) is simple enough that an ORM adds overhead without value.

7. **React built-in state management** — useState, useReducer, custom hooks. No external state library until complexity warrants it.

8. **Vitest for testing** — Vite-native, Jest-compatible API, fast execution.

9. **REST API over GraphQL** — CRUD operations are straightforward; REST is simpler and sufficient.

#### Consequences
- All team members should follow the directory structure defined in `docs/architecture.md`
- Backend agents work in `src/server/`, frontend agents in `src/client/`, shared types in `src/shared/`
- Database schema changes must be documented in the architecture doc

### Decision: Feed API Contract Standardization

**Date:** 2026-04-30
**Author:** Spike
**Status:** Accepted
**Scope:** Feed API response shape and route wiring

#### Context
Frontend feed-detail hooks consume `detail.feed` and `detail.articles`. Existing backend route implementations had drifted: `src/server/app.ts` and `src/server/routes/feedRoutes.ts` returned different payload shapes and status codes. That drift made it easy for client and server expectations to diverge again.

#### Decisions

1. **Standardize response shape** — `POST /api/feeds`, `GET /api/feeds/:id`, and `POST /api/feeds/:id/refresh` return both top-level feed fields and a nested `feed` object with `articles`.

2. **Keep array endpoints consistent** — `GET /api/feeds` and `GET /api/search` remain as array responses.

3. **Single source of truth** — Route all runtime and test traffic through the same router implementation so contracts stay synchronized.

#### Consequences
- Frontend hooks can safely rely on `detail.feed`.
- Existing backend callers and route tests that read top-level feed fields continue to work.
- Future contract changes must be made once in `src/server/routes/feedRoutes.ts` and reflected in `src/shared/types/api.ts`.

### Decision: Frontend Design System Foundation

**Date:** 2026-04-30
**Author:** Faye
**Status:** Accepted
**Scope:** `src/client/`

#### Context
Adlene requested a significant visual refresh for the RSS Reader frontend so the product feels polished, modern, and professional without changing backend contracts.

#### Decisions

1. **Token-based CSS design system** — Adopt custom properties in `src/client/styles.css` for brand colors, surfaces, text, borders, semantic states, spacing, radius, and shadows.

2. **Dark-mode-ready theme** — Define default token set in `:root` and override with `prefers-color-scheme: dark`.

3. **Standardized presentation** — Hero surfaces, feed avatars, pill metadata, consistent buttons, skeleton loaders, friendly empty/error states.

#### Consequences
- Future frontend work reuses shared CSS variables and component patterns.
- New components support focus-visible states, responsive behavior, and semantic status styling by default.
- Larger frontend additions can layer on the existing theme without renegotiating API shapes.

### Decision: External Feed Discovery Service

**Date:** 2026-04-30
**Author:** Spike
**Status:** Accepted
**Scope:** Feed search and discovery

#### Context
`GET /api/search?q=` only handled direct/local-style matches and did not discover feeds from arbitrary websites or topic searches.

#### Decisions

1. **Keep existing search contract** — `GET /api/search` returns the same `SearchResult[]` shape.

2. **Add feedDiscoveryService layer** — New `src/server/services/feedDiscoveryService.ts` as the backend discovery engine.

3. **Tiered discovery strategy:**
   - Direct RSS/Atom parse when query is a feed URL
   - Website HTML auto-discovery via `<link rel="alternate" type="application/rss+xml|application/atom+xml">`
   - Common feed-path probing: `/feed`, `/rss`, `/rss.xml`, `/feed.xml`, `/atom.xml`
   - Keyword bootstrap via free web search, then run site discovery on returned sites

4. **Best-effort treatment** — External discovery has short timeouts and empty-result fallbacks; ordinary misses do not become API failures.

#### Consequences
- Backend search performs real external discovery without paid services or API keys.
- Frontend keeps current result contract while gaining clearer discovery messaging.
- Discovery quality can improve later without API contract changes.

### Decision: Code Review Priorities and Security Remediation Plan

**Date:** 2026-04-30
**Author:** Jet (Lead)
**Status:** Proposed
**Scope:** Frontend (React) + Backend (Express/SQLite)

#### Context
A comprehensive code review identified 13 valid findings: 5 frontend, 8 backend. Findings span security vulnerabilities (CORS, SSRF, XSS), data integrity bugs (race conditions, unique constraint handling), and UX/scalability issues. This decision establishes remediation priority and team assignments.

#### Decisions

1. **Four-tier priority system (P0–P3)**
   - P0 (Critical Security): CORS misconfiguration, SSRF, unvalidated URLs—block all feature work
   - P1 (Data Integrity): Race conditions, constraint violations—must fix before next release
   - P2 (Frontend UX/Stability): Error boundaries, race conditions in hooks, memory leaks
   - P3 (Scalability): Pagination, rate limiting—plan but do not block current work

2. **Security-first remediation rules**
   - CORS: Explicit whitelist of allowed origins (localhost:5173 dev, production domain prod)
   - SSRF: Validate all external URLs; reject localhost, private IPs (10.*, 172.16-31.*, 192.168.*, 169.254.*), and non-HTTP/HTTPS schemes
   - URLs: Helper `sanitizeUrl()` that accepts only `http:` and `https:` schemes; block `data:`, `javascript:`, `vbscript:`

3. **Data integrity fixes**
   - B3 (createArticle): Check `result.changes` after `INSERT OR IGNORE`; if 0, SELECT to retrieve existing row
   - B4 (subscribeToFeed): Wrap duplicate check + insert in transaction; catch UNIQUE constraint and return 409
   - B5 (updateFeed): Try/catch URL updates; detect `SQLITE_CONSTRAINT_UNIQUE`, return 409

4. **Frontend race condition prevention**
   - F2/F3 (useFeed, useSearch): Use `AbortController` to cancel prior requests; add 300ms debounce to search

5. **No dedicated QA agent**—Instead, extend Ed's charter to include security review (SSRF, CORS, XSS, injection patterns) on all API routes and URL-displaying components. A checklist and Ed's existing expertise suffice; a separate agent adds coordination overhead without clear value.

#### Consequences
- Spike leads P0–P3 backend fixes; Faye leads P2 frontend work
- Ed's charter expands immediately to security review on all PRs
- Jet approves all P0 and P1 merges before landing
- No new features start until P0 (B1, B2, F5) are resolved
- Each priority tier requires Ed's validation before merge

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
