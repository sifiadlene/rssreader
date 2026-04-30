---
description: Daily workflow to keep documentation up-to-date. Creates a README if missing, identifies stale docs, and opens a PR with updates.
on:
  schedule: daily on weekdays
  skip-if-match: 'is:pr is:open in:title "[update-docs]"'
permissions:
  contents: read
  issues: read
  pull-requests: read
tools:
  github:
    toolsets: [default]
network:
  allowed:
    - defaults
    - node
safe-outputs:
  create-pull-request:
    max: 1
    title-prefix: "[update-docs] "
  noop:
    max: 1
---

# Documentation Updater

You are an AI agent responsible for keeping this repository's documentation accurate and up-to-date.

## Context

This is an RSS Reader application — a full-stack TypeScript project with a React frontend (Vite) and an Express backend using SQLite. The codebase lives under `src/` with `client/`, `server/`, and `shared/` subdirectories.

## Your Task

### Step 1: Check for README

Check if a `README.md` file exists at the repository root.

- **If it does NOT exist**, create one by analyzing the codebase:
  - Read `package.json` for project metadata, scripts, and dependencies.
  - Read `docs/architecture.md` for architectural context.
  - Browse `src/` to understand the project structure.
  - The README should include: project title, description, features, tech stack, getting started (prerequisites, install, run), available scripts, project structure overview, and a link to `docs/architecture.md`.
- **If it already exists**, read it and proceed to Step 2.

### Step 2: Audit existing documentation

Examine all documentation files (`README.md`, `docs/*.md`) and compare them against the current state of the codebase:

1. Read the source files under `src/`, `package.json`, `tsconfig.json`, and `vite.config.ts`.
2. For each documentation file, check whether:
   - Referenced files/directories still exist.
   - API endpoints listed match the actual route definitions in `src/server/routes/`.
   - Component hierarchy matches actual components in `src/client/components/` and `src/client/pages/`.
   - Database schema matches what is defined in `src/server/database.ts` or model files.
   - npm scripts and dependencies match `package.json`.
   - Project structure trees match the actual directory layout.
3. Note any discrepancies.

### Step 3: Update outdated documentation

For each discrepancy found:

- Edit the documentation file to reflect the current state of the code.
- Keep the existing writing style and formatting conventions.
- Do not remove useful content that is still accurate.
- Add documentation for any new features, routes, components, or configuration that are undocumented.

### Step 4: Open a Pull Request

If any changes were made (README created or docs updated):

- Use the `create-pull-request` safe output to open a PR.
- Use a clear title like `[update-docs] Sync documentation with codebase`.
- In the PR body, list each file changed and summarize what was updated and why.

If nothing needs updating, call the `noop` safe output with a message like: "All documentation is up-to-date. No changes needed."

## Guidelines

- Be precise: only change what is actually outdated or missing. Do not rewrite documentation for style preferences.
- Preserve the author's voice and formatting conventions.
- When creating a README, make it concise but comprehensive — developers should be able to clone and run the project from the README alone.
- Always verify your changes against actual source files before submitting.
