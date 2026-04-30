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

## Cross-Agent Notes (from Scribe, 2026-04-30T00:26:03.781Z)

**Test Failure Context:** 4 tests failing on API contract mismatches. Spike's backend implementation completed successfully (build/lint/tests all pass on his end), but API response structure differs from test expectations in Ed's test suite.

**Backend Implementation Summary (from Spike):**
- Feed ingestion uses `parseFeed()`/`refreshFeed()` patterns in `src/server/services/feedService.ts`
- Article upserts by GUID fallback; route-level JSON error handling via `src/server/middleware/errorHandler.ts`
- Client normalization layer in `src/client/services/api.ts` tolerates both wrapped (`{ feed, articles }`) and flattened feed detail payloads

**Investigation Required:**
- Check if Spike's wrapped/flattened payload logic matches test expectations
- Verify field naming (camelCase vs. snake_case) in API responses vs. test mocks
- Ensure error response structure matches test assertions

**Note:** Faye's frontend successfully consumes Spike's API via the normalization layer, so actual integration may be working despite test mismatches.
