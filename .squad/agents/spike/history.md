# Spike — History

## Project Context
- **Project:** RSS Reader — search, add, view summaries, and store RSS feeds
- **Stack:** React + Node.js/Express
- **User:** Adlene

## Architecture Reference (from Jet, 2026-04-30)

**Tech Stack:**
- Frontend: React 18 + Vite (TypeScript)
- Backend: Express 4 (Node.js)
- Database: SQLite via better-sqlite3
- RSS Parsing: rss-parser (server-side)
- Testing: Vitest
- State Management: React built-in (useState, useReducer, custom hooks)

**Directory Structure:**
- `src/client/` — React frontend (components, hooks, pages, services)
- `src/server/` — Express backend (routes, services, models, middleware)
- `src/shared/` — Shared TypeScript types

**Key Database Schema:**
- `feeds` table — id, title, url, description, site_url, image_url, created_at, updated_at
- `articles` table — id, feed_id, title, link, snippet, author, pub_date, guid, is_read, created_at

**Key API Routes:**
- GET/POST/DELETE `/api/feeds` — feed management
- GET `/api/feeds/:id` — feed details + articles
- POST `/api/feeds/:id/refresh` — re-fetch articles
- GET `/api/search?q=` — search for feeds

**Important Decisions:**
- Monorepo with single package.json for simplicity
- Server-side RSS fetching to avoid CORS issues
- No ORM — raw SQL for simple 2-table schema
- REST API (not GraphQL)
- No external state library yet

See `docs/architecture.md` for complete details.

## Learnings

- Implemented the backend foundation in `src/server/models/`, `src/server/services/`, `src/server/routes/`, `src/server/middleware/`, and `src/server/index.ts` with `better-sqlite3` tables for feeds/articles and raw SQL CRUD helpers.
- Added shared API/domain contracts in `src/shared/types/` and kept client normalization tolerant of both wrapped (`{ feed, articles }`) and flattened feed detail payloads consumed across the app.
- Feed ingestion now follows `parseFeed()`/`refreshFeed()` patterns in `src/server/services/feedService.ts`, including RSS parsing, article upserts by GUID fallback, and route-level JSON error handling via `src/server/middleware/errorHandler.ts`.
- Validation now passes through `npm test`, `npm run build`, and `npm run lint`; lint support was enabled with a flat ESLint config in `eslint.config.js` plus TypeScript ESLint tooling.
- Unified `src/server/app.ts` and `src/server/routes/feedRoutes.ts` so test and runtime traffic now share the same handlers, preventing API drift between the Express app entrypoint and the mounted router.
- Standardized feed detail responses to include both top-level feed fields and a nested `feed` object alongside `articles`, which keeps backend route tests and frontend hooks compatible with the same payload.
- 2026-04-30T01:02:12.403+00:00 — External feed discovery now combines direct feed parsing, HTML `<link rel="alternate">` auto-discovery, and common RSS path probing in `src/server/services/feedDiscoveryService.ts`, while keyword searches use a free no-key web search bootstrap before site-level discovery.
- 2026-04-30T01:02:12.403+00:00 — The `GET /api/search` contract stayed as a plain `SearchResult[]`, so frontend consumers only needed UX copy/loading updates instead of payload changes.
- 2026-04-30T01:02:12.403+00:00 — External discovery is timeout-bounded and best-effort; public search/bootstrap services can fail or throttle, so the backend degrades to empty results instead of surfacing transport errors for normal misses.
- 2026-04-30T16:56:44.815+00:00 — Backend audit found unresolved P0 security gaps in `src/server/app.ts` and feed-fetching services: CORS is still fully open, SSRF defenses are still missing on feed/discovery fetches, and `POST /api/feeds` currently fetches/parses the same remote feed twice before responding.
- 2026-04-30T16:56:44.815+00:00 — The backend remains structurally simple and test-green, but it still lacks schema-based input validation, pagination, migration/versioning support, scheduled refresh/health monitoring, and dedicated routes for article read state or OPML workflows.

## Cross-Agent Notes (from Scribe, 2026-04-30T00:26:03.781Z)

**Integration Issue:** Ed's test suite (24/28 passing) reports 4 failures on API contract mismatches. Likely causes:
- Backend payload structure differs from test expectations (especially feed detail responses with wrapped vs. flattened payloads)
- Field naming inconsistency between API responses and shared types contract
- Possible async timing or error response handling differences

**Action:** Consult Ed's failing test output in `src/server/__tests__/` and `src/client/__tests__/` to identify exact mismatches. Verify API responses match the schema defined in `src/shared/types/index.ts` and test contracts.

---

## Cross-Agent Notes (from Scribe, 2026-04-30T13:13:04Z)

**Code Review Findings — Your Assignments:**

Jet's comprehensive code review identified 13 valid findings across backend. You lead **all backend fixes** across security (P0), data integrity (P1), and scalability (P3) tiers:

**P0 — Security (Week 1, immediate blockers):**
- B1: CORS misconfiguration in `app.ts:9` — add explicit origin whitelist (localhost:5173 dev, production domain prod)
- B2: SSRF in `feedService.ts:41-52`, `feedDiscoveryService.ts:20-35` — validate all external URLs; reject localhost, private IPs (10.*, 172.16-31.*, 192.168.*, 169.254.*), and non-HTTP/HTTPS schemes

**P1 — Data Integrity (Week 1, after P0):**
- B3: `createArticle` bug in `articleModel.ts:77-91` — check `result.changes` after `INSERT OR IGNORE`; if 0, SELECT to retrieve existing
- B4: Race condition in `subscribeToFeed` `feedService.ts:118-141` — wrap duplicate check + insert in SQLite transaction; catch UNIQUE constraint → 409
- B5: UNIQUE constraint uncaught in `updateFeed` `feedModel.ts:87-107` — try/catch URL updates; detect `SQLITE_CONSTRAINT_UNIQUE` → 409

**P3 — Scalability (Week 3, after P0/P1 stable):**
- B6: No pagination `feedRoutes.ts:89-99`, `articleModel.ts:41-45` — add `?page=1&limit=50` params; return paginated response with total/page/limit/items[]
- B7: No rate limiting — add `express-rate-limit` on `/api/search` and `/api/feeds` POST routes; limit: 20 req/min per IP

**Important:** Ed validates each tier before merge. P0 blocks all new feature work.

See `.squad/decisions.md` → "Code Review Priorities and Security Remediation Plan" for full remediation rules and context.

### 2026-04-30 — Backend Audit & Security Findings Consolidated

- Backend API & performance audit completed; critical security gaps and data integrity issues documented.
- CORS, SSRF, and request body size limits flagged for immediate P0 remediation.
- `createArticle` duplicate path bug and race condition handling wrapped into P1 priority roadmap.
- Ready to execute security-first implementation phase starting with P0 vulnerabilities.

