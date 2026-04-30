# RSS Reader

A full-stack RSS feed reader that lets you search for, subscribe to, and read articles from RSS feeds. Built with React on the frontend and Express + SQLite on the backend, all in TypeScript.

## Features

- **Search** for RSS feeds by keyword or URL
- **Subscribe** to feeds and persist subscriptions in a local SQLite database
- **Read** article summaries with titles, snippets, authors, and dates
- **Refresh** feeds on demand to fetch the latest articles
- **Unsubscribe** from feeds at any time

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Frontend    | React 18 + Vite         |
| Routing     | React Router v6         |
| Backend     | Express (Node.js)       |
| Database    | SQLite (better-sqlite3) |
| RSS Parsing | rss-parser              |
| Language    | TypeScript              |
| Testing     | Vitest                  |

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Install

```bash
git clone https://github.com/sifiadlene/rssreader.git
cd rssreader
npm install
```

### Run in Development

```bash
npm run dev
```

This starts both the Vite dev server (frontend, default port 5173) and the Express API server (backend, default port 3001, configurable via `PORT`) concurrently.

### Build for Production

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript and bundles the frontend. `npm start` serves the production build.

## Available Scripts

| Script           | Description                                          |
|------------------|------------------------------------------------------|
| `npm run dev`    | Start frontend + backend in development (watch mode) |
| `npm run dev:client` | Start only the Vite dev server                   |
| `npm run dev:server` | Start only the Express server with nodemon       |
| `npm run build`  | Build frontend and compile TypeScript                |
| `npm start`      | Run the production server                            |
| `npm test`       | Run the Vitest test suite once                       |
| `npm run test:watch` | Run Vitest in watch mode                         |
| `npm run lint`   | Lint source files with ESLint                        |

## Project Structure

```
rssreader/
├── docs/
│   └── architecture.md          # Detailed architecture documentation
├── src/
│   ├── client/                  # React frontend
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks (useFeed, useFeeds, useSearch)
│   │   ├── pages/               # Route-level pages (FeedListPage, FeedSearchPage, FeedDetailPage)
│   │   └── services/            # API client functions
│   ├── server/                  # Express backend
│   │   ├── middleware/          # Error handling middleware
│   │   ├── models/              # Database access layer
│   │   ├── routes/              # Express route handlers
│   │   └── services/            # Business logic (feed parsing, search, articles)
│   ├── shared/
│   │   └── types/               # TypeScript interfaces shared between client and server
│   └── test/                    # Shared test fixtures and setup
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Overview

| Method | Endpoint                  | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | `/api/feeds`              | List all subscribed feeds           |
| POST   | `/api/feeds`              | Subscribe to a new feed (body: URL) |
| DELETE | `/api/feeds/:id`          | Unsubscribe from a feed             |
| GET    | `/api/feeds/:id`          | Get feed details + articles         |
| POST   | `/api/feeds/:id/refresh`  | Re-fetch articles for a feed        |
| GET    | `/api/search?q=`          | Search for feeds by keyword/URL     |

## Documentation

See [`docs/architecture.md`](docs/architecture.md) for a detailed breakdown of the frontend component hierarchy, backend service layer, database schema, and key technical decisions.
