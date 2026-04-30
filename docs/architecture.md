# RSS Reader — Architecture

> Defined: 2026-04-30 | Author: Jet (Lead)

## Overview

The RSS Reader is a full-stack web application that lets users search for RSS feeds, subscribe to them, view article summaries, and persist subscriptions. It follows a monorepo structure with a React frontend and an Express backend communicating over a REST API.

```
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────┐
│   React Frontend    │──────▶│   Express Backend   │──────▶│  SQLite   │
│   (Vite + SPA)      │ REST  │   (Node.js API)     │       │  Database │
└─────────────────────┘       └─────────────────────┘       └──────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  RSS Sources     │
                              │  (External URLs) │
                              └─────────────────┘
```

## Tech Stack

| Layer       | Technology                | Rationale                                      |
|-------------|---------------------------|-------------------------------------------------|
| Frontend    | React + Vite              | Fast dev experience, modern tooling              |
| Backend     | Express (Node.js)         | Lightweight, well-known, fast to iterate         |
| Database    | SQLite (better-sqlite3)   | Zero-config, file-based, perfect for single-user |
| RSS Parsing | rss-parser                | Mature library, handles RSS 2.0, Atom, RDF       |
| Language    | TypeScript                | Shared types between client and server           |
| Testing     | Vitest                    | Fast, Vite-native, compatible with Jest API      |

## Project Structure

```
rssreader/
├── docs/                    # Documentation
│   └── architecture.md
├── src/
│   ├── client/              # React frontend
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route-level page components
│   │   └── services/        # API client functions
│   ├── server/              # Express backend
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # Business logic (feed parsing, search)
│   │   ├── models/          # Database access layer
│   │   └── middleware/      # Express middleware (error handling, etc.)
│   ├── shared/              # Shared types/interfaces
│   │   └── types/           # TypeScript interfaces used by both sides
│   └── test/                # Shared test fixtures and setup
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Frontend Architecture

### Component Hierarchy

```
<App>
├── <Header />                    # App title, navigation
├── <Routes>
│   ├── <FeedSearchPage />        # Search for new feeds
│   │   ├── <SearchBar />         # Input + search button
│   │   └── <SearchResults />     # List of discovered feeds
│   │       └── <FeedPreview />   # Single feed preview + subscribe button
│   ├── <FeedListPage />          # List of subscribed feeds
│   │   └── <FeedCard />          # Feed title, description, unread count
│   └── <FeedDetailPage />        # Articles from a single feed
│       └── <ArticleItem />       # Title, snippet, date, link
└── <Footer />
```

### State Management

- **React built-in state** — `useState` and `useReducer` for local component state.
- **Custom hooks** — `useFeed`, `useFeeds`, `useSearch` encapsulate API calls and loading/error states.
- **No external state library** — The app is simple enough that React's built-in tools suffice. If complexity grows, consider Zustand.

### Routing

- **React Router v6** — Client-side routing with three main routes:
  - `/` → `FeedListPage` (home — subscribed feeds)
  - `/search` → `FeedSearchPage` (discover and add feeds)
  - `/feed/:id` → `FeedDetailPage` (articles from one feed)

## Backend Architecture

### API Routes

| Method | Endpoint               | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | `/api/feeds`           | List all subscribed feeds            |
| POST   | `/api/feeds`           | Subscribe to a new feed (body: URL)  |
| DELETE | `/api/feeds/:id`       | Unsubscribe from a feed              |
| GET    | `/api/feeds/:id`       | Get feed details + articles          |
| POST   | `/api/feeds/:id/refresh` | Re-fetch articles for a feed       |
| GET    | `/api/search?q=`       | Search for feeds by keyword/URL      |

### Service Layer

- **FeedService** — Core business logic:
  - `parseFeed(url)` — Fetch and parse an RSS feed URL using `rss-parser`
  - `searchFeeds(query)` — Discover feeds (can query external search APIs or attempt URL parsing)
  - `refreshFeed(id)` — Re-fetch a stored feed and update articles
- **ArticleService** — Article-level operations:
  - `getArticles(feedId)` — Retrieve stored articles for a feed
  - `markAsRead(articleId)` — Mark an article as read

### Error Handling

- Centralized error-handling middleware returns consistent JSON errors:
  ```json
  { "error": { "message": "Feed not found", "code": "FEED_NOT_FOUND" } }
  ```
- Input validation on all POST routes.
- Graceful handling of unreachable/malformed RSS feeds.

## Database Schema (SQLite)

```sql
CREATE TABLE feeds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL UNIQUE,
  description TEXT,
  site_url    TEXT,
  image_url   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id     INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  link        TEXT NOT NULL,
  snippet     TEXT,
  author      TEXT,
  pub_date    DATETIME,
  guid        TEXT,
  is_read     INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(feed_id, guid)
);

CREATE INDEX idx_articles_feed_id ON articles(feed_id);
CREATE INDEX idx_articles_pub_date ON articles(pub_date);
```

### Why SQLite?

- Zero configuration — just a file on disk
- Perfect for single-user desktop/local apps
- No separate database server to manage
- `better-sqlite3` is synchronous and fast — no callback complexity
- Easy to migrate to PostgreSQL later if needed (standard SQL)

## RSS Parsing Strategy

- Use `rss-parser` npm package — handles RSS 2.0, Atom, and RDF formats
- The server fetches and parses feeds — **never the client** (avoids CORS issues)
- On subscribe: parse feed once, store metadata + initial articles
- On refresh: re-parse feed, upsert new articles by GUID, skip duplicates
- Refresh can be manual (user-triggered) or on a configurable interval

## Key Technical Decisions

| Decision                     | Choice              | Rationale                                        |
|------------------------------|---------------------|--------------------------------------------------|
| Monorepo                     | Single package.json | Simplicity — shared types, single install         |
| TypeScript everywhere        | Yes                 | Type safety across client/server boundary         |
| SQLite over PostgreSQL       | SQLite              | Zero-config, file-based, sufficient for this scope|
| Vite over CRA/Webpack        | Vite                | Fast HMR, native TS support, modern defaults      |
| Server-side RSS fetching     | Yes                 | Avoids CORS, centralizes parsing logic            |
| REST over GraphQL            | REST                | Simpler for CRUD-style operations                 |
| No ORM                       | Raw SQL             | SQLite queries are simple; ORMs add overhead      |
| Vitest over Jest             | Vitest              | Native Vite integration, faster execution         |

## Development Workflow

- `npm run dev` — Starts both Vite dev server (frontend) and nodemon (backend) concurrently
- `npm run build` — Builds frontend with Vite, compiles server with TypeScript
- `npm run start` — Runs the production server (serves built frontend + API)
- `npm test` — Runs Vitest test suite
