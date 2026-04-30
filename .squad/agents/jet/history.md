# Jet — History

## Project Context
- **Project:** RSS Reader — search, add, view summaries, and store RSS feeds
- **Stack:** React + Node.js/Express
- **User:** Adlene

## Learnings

### 2026-04-30 — Architecture Foundation
- **Stack:** React 18 + Vite (frontend), Express 4 + TypeScript (backend), SQLite via better-sqlite3 (database)
- **Monorepo:** Single package.json, shared types in `src/shared/types/`
- **RSS parsing:** Server-side only via `rss-parser` — avoids CORS, centralizes logic
- **Database:** SQLite chosen for zero-config simplicity; schema has `feeds` and `articles` tables
- **No ORM:** Raw SQL — queries are simple, ORMs add overhead for this scope
- **State management:** React built-ins only (useState, useReducer, custom hooks) — no Redux/Zustand
- **Routing:** React Router v6 with 3 routes: `/` (feed list), `/search`, `/feed/:id`
- **Testing:** Vitest (Vite-native, fast)
- **Key files:** `docs/architecture.md`, `package.json`
- **User (Adlene) language:** French — responds in French sometimes
