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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
