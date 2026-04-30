# Ed — History

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

- 2026-04-30T00:26:03.781+00:00 — Established contract-first Vitest coverage across `src/server/__tests__/` and `src/client/__tests__/` so implementation can land against stable test targets.
- Backend tests favor in-memory SQLite expectations, mocked `rss-parser`, and route-level Supertest coverage to isolate parsing, persistence, and HTTP behavior.
- Frontend tests lock in API client request shapes and minimal render contracts for `Header`, `FeedCard`, and `ArticleItem` without over-specifying styling details.
- 2026-04-30T16:56:44.815+00:00 — Audit baseline: `npm run lint`, `npm run build`, and `npm test` all pass; Vitest coverage cannot run because `@vitest/coverage-v8` is missing.
- 2026-04-30T16:56:44.815+00:00 — Current automated tests are concentrated in API contracts and happy-path model/service flows, with major gaps in frontend hooks/pages, route error branches, concurrency/data-integrity cases, and security regression coverage for CORS/SSRF/XSS.

## Cross-Agent Notes (from Scribe, 2026-04-30T00:26:03.781Z)

**API Contract Resolved:** Spike fixed API contract mismatches. All 28 tests now pass, build clean, lint clean.

**Contract Standardization:**
- `POST /api/feeds`, `GET /api/feeds/:id`, `POST /api/feeds/:id/refresh` now return consistent shape with both top-level feed fields and nested `feed` object with `articles`
- `GET /api/feeds` and `GET /api/search` remain array responses
- Single router implementation ensures client and server contracts stay synchronized

**Stability:** API response shape is now stable. Route tests and Ed's test suite expectations are now aligned. Backend implementation and frontend hooks can work with confidence.

---

## Cross-Agent Notes (from Scribe, 2026-04-30T13:13:04Z)

**Charter Expansion — Security Review:**

Jet's code review analysis recommended extending your charter to include security review on all PRs touching API routes or components displaying URLs. This replaces the proposal for a dedicated QA agent.

**Your new responsibilities:**
- SSRF review: Validate all external URL parameters against blocklist (localhost, private IPs, non-HTTP/HTTPS schemes)
- CORS review: Confirm explicit origin whitelist (not open)
- XSS review: Confirm URL injection prevention (sanitizeUrl() helper, no `data:` or `javascript:` schemes)
- SQL injection review: Parameterized queries on all database operations

**For each assignment group (P0, P1, P2, P3), you validate before merge.** Spike and Faye implement fixes; you gate releases.

See `.squad/decisions.md` → "Code Review Priorities and Security Remediation Plan" for full context.

### 2026-04-30 — Test Audit & Coverage Baseline Established

- Test coverage and quality audit completed; implementation contract validated across 8 core paths.
- Coverage gaps identified corresponding to improvement priorities (P0 security, P1 integrity, P2 features).
- Ready to track test improvements against defined contract and add regression tests for security fixes.

