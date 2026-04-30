# Faye — History

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

- 2026-04-30T00:26:03.781+00:00 — Built the React shell in `src/client/` with route-driven pages (`FeedListPage`, `FeedSearchPage`, `FeedDetailPage`) and reusable UI in `src/client/components/` so composition stays page-first and presentation stays modular.
- 2026-04-30T00:26:03.781+00:00 — Centralized fetch logic in `src/client/services/api.ts` and async state in `src/client/hooks/` (`useFeeds`, `useFeed`, `useSearch`) to keep rendering components simple.
- 2026-04-30T00:26:03.781+00:00 — Kept all frontend styling in `src/client/styles.css`, using responsive cards, stacked mobile layouts, and shared button/status primitives for a minimal interface.

## Cross-Agent Notes (from Scribe, 2026-04-30T00:26:03.781Z)

**API Contract Resolved:** Spike fixed API contract mismatches. All 28 tests now pass, build clean, lint clean.

**Contract Standardization:**
- `POST /api/feeds`, `GET /api/feeds/:id`, `POST /api/feeds/:id/refresh` now return consistent shape with both top-level feed fields and nested `feed` object with `articles`
- `GET /api/feeds` and `GET /api/search` remain array responses
- Single router implementation ensures client and server contracts stay synchronized

**Stability:** API response shape is now stable. Frontend hooks (`useFeed`, `useFeeds`) can safely rely on `detail.feed` and `detail.articles`.
