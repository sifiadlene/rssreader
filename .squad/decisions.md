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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
