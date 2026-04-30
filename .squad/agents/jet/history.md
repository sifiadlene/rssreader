# Jet — History

## Project Context
- **Project:** RSS Reader — search, add, view summaries, and store RSS feeds
- **Stack:** React + Node.js/Express
- **User:** Adlene

## Learnings

### 2026-04-30 — Audit d'amélioration architecture + qualité

- **P0 toujours ouverts** : la remédiation CORS/SSRF/URL non sûres n'est pas terminée. `app.use(cors())` reste permissif et `feedService` / `feedDiscoveryService` acceptent encore des URLs externes sans allowlist de schéma, d'hôte ou d'IP.
- **Le plus gros gaspillage de perf backend** : `POST /api/feeds` parse déjà le feed dans `subscribeToFeed`, puis appelle immédiatement `refreshFeed`, ce qui refait un second fetch réseau complet au moment de l'abonnement.
- **Dette d'architecture** : la couche routes mélange accès direct aux modèles et appels service; le boundary `routes -> services -> models` n'est pas appliqué uniformément.
- **Bug données encore présent** : `createArticle` utilise toujours `INSERT OR IGNORE` + `lastInsertRowid`, donc le chemin doublon peut retourner un mauvais article tant qu'un test de non-régression n'existe pas.
- **Frontend plus sûr pour le HTML que pour les URLs** : pas de `dangerouslySetInnerHTML`, mais les `href`/`src` issus des feeds restent rendus sans helper `sanitizeUrl`.
- **DX** : lint/test/build passent, mais les workflows GitHub présents automatisent surtout la squad; il manque une vraie CI applicative pour exécuter validation et sécurité à chaque PR.

### 2026-04-30 — Revue de code complète (frontend + backend)

- **13 findings validés** : 5 frontend, 7 backend (+ 1 backend = 8 total). Aucun faux positif.
- **Top priorité sécurité :** CORS ouvert (`cors()` sans config) + SSRF (feedDiscoveryService accepte n'importe quelle URL) — à corriger avant toute nouvelle feature.
- **Bug données critique :** `createArticle` avec `INSERT OR IGNORE` + `lastInsertRowid` retourne un mauvais ID sur doublon — pattern à bannir dans tout le codebase SQLite.
- **Race conditions frontend :** useFeed et useSearch n'annulent pas les requêtes en vol — AbortController est le pattern correct dans React 18.
- **URL validation :** Tout `href` issu d'un feed RSS doit passer par un helper `sanitizeUrl` qui autorise uniquement `http:` et `https:`.
- **Décision équipe :** Pas de nouvel agent QA — étendre le charter d'Ed à la revue sécurité suffit. Un agent de plus = overhead de coordination non justifié au stade actuel.
- **Décision process :** P0 (sécurité) bloque les nouvelles features. Ed valide chaque lot avant merge.
- **Fichier de décision produit :** `.squad/decisions/inbox/jet-code-review-priorities.md`

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

### 2026-04-30 — Audit Orchestration Complete

- Finalized improvement audit recommendations across P0 (security), P1 (data integrity), P2 (product), P3 (DX).
- Recommendations consolidated to `decisions.md` for team prioritization and execution.
- All agents (Jet, Faye, Spike, Ed) completed concurrent audits; ready for implementation phase.

