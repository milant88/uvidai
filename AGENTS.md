# AGENTS.md — Codex Instructions for UvidAI

## Project Overview

UvidAI is an AI-powered hyper-local intelligence platform for Belgrade and Novi Sad (Serbia). It integrates public data sources (APR business registry, Katastar/cadastre, environmental sensors, social infrastructure) into a unified AI agent interface. Users ask natural-language questions about any micro-location and get a comprehensive analysis covering legal status, air quality, nearby schools/healthcare, walkability, and more.

## Repository Structure

This is an Nx monorepo (`@uvidai/source`). Key layout:

```
apps/
  web/          — Next.js 16 public-facing app (App Router)
  admin/        — Next.js 16 admin dashboard (App Router)
  api/          — NestJS 11 backend API
  mobile/       — React Native / Expo mobile app
packages/
  shared/       — Shared TypeScript types, Zod schemas, constants
  ai-core/      — AI provider abstraction layer (LLM calls, embeddings, agents)
  data-connectors/ — Adapters for external data sources (APR, GeoSrbija, SEPA, OSM)
  i18n/         — Internationalization strings and utilities
docs/
  prompts/      — Agent prompt templates (markdown)
```

## Tech Stack

| Layer    | Technology                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Monorepo | Nx 22                                                                        |
| Frontend | Next.js 16, React 19, TanStack Query, Zustand, MapLibre GL JS                |
| Admin    | Next.js 16, React 19                                                         |
| Backend  | NestJS 11, Prisma ORM, class-validator, class-transformer                    |
| Mobile   | React Native, Expo                                                           |
| Database | PostgreSQL + PostGIS + pgvector                                              |
| Cache    | Redis                                                                        |
| Search   | Meilisearch                                                                  |
| AI       | Vercel AI SDK, multi-provider (OpenAI, Google Gemini, Anthropic) via ai-core |
| Testing  | Vitest (unit), supertest (API integration), Playwright (e2e)                 |
| i18n     | next-intl, sr-Latn, sr-Cyrl, en, ru                                          |

## Coding Conventions

### TypeScript

- Strict mode enabled everywhere (`strict: true` in tsconfig).
- No `any` — use `unknown` and narrow with type guards or Zod.
- Prefer `interface` for object shapes, `type` for unions/intersections.

### File Naming

- Files and directories: `kebab-case` (e.g., `user-profile.service.ts`).
- React components and classes: `PascalCase` (e.g., `UserProfile.tsx` exports `UserProfile`).
- Functions and variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.

### Imports

- Always import shared types from `@uvidai/shared` — never duplicate type definitions across apps.
- Use path aliases defined in `tsconfig.base.json`.
- Order imports: node builtins → external packages → `@uvidai/*` workspace packages → relative imports. Separate each group with a blank line.

### Validation

- Use Zod schemas from `packages/shared/src/validation/` for runtime validation.
- On the backend, use class-validator decorators on DTOs for NestJS pipe validation.
- Frontend forms validate with Zod before submission.

### React / Next.js

- Functional components only — no class components.
- Server Components by default in Next.js App Router; add `'use client'` only when hooks or browser APIs are required.
- State: Zustand for global/cross-component state, React `useState`/`useReducer` for local state.
- Data fetching: TanStack Query with typed query keys.

### NestJS

- Each feature is a module containing: controller, service, DTOs, and optional guards/interceptors.
- Prisma for all database access; raw SQL only for PostGIS spatial queries and pgvector similarity search.
- Every endpoint has OpenAPI decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).
- Error handling through NestJS exception filters.

### CSS / Styling

- Tailwind CSS as the primary styling approach.
- CSS Modules when component-scoped styles are needed.

## Architecture Rules

1. **AI Abstraction** — All LLM/embedding calls go through `packages/ai-core`. Never call OpenAI/Gemini/Anthropic SDKs directly from app code.
2. **Data Connectors** — All external data source integrations live in `packages/data-connectors`. Each connector exports a typed interface.
3. **Shared Types** — All cross-app types, enums, and Zod schemas live in `packages/shared`. Import as `@uvidai/shared`.
4. **i18n** — All user-facing strings must use i18n keys from `packages/i18n`. Supported locales: `sr-Latn`, `sr-Cyrl`, `en`, `ru`.
5. **Agent Prompts** — Store prompt templates in `docs/prompts/` as markdown files. Load them at runtime; never hardcode prompts in source.

## Testing

- **Unit tests**: Vitest. Place test files next to source as `*.spec.ts` or `*.test.ts`.
- **API integration tests**: supertest against the NestJS app.
- **E2E tests**: Playwright, located in `apps/web-e2e/` and `apps/admin-e2e/`.
- Run all tests: `npx nx run-many -t test`.
- Run affected tests: `npx nx affected -t test`.

## Commit Messages

Use conventional commits:

```
feat: add location walkability score endpoint
fix: correct PostGIS distance calculation for SRID 4326
docs: update API authentication guide
refactor: extract APR data parsing to shared utility
test: add integration tests for air quality module
chore: upgrade Nx to 22.x
```

## Security

- **Never commit secrets** — use environment variables via `.env` files (gitignored).
- Sanitize all user input before database queries.
- Use parameterized queries (Prisma handles this by default).
- API rate limiting with `@nestjs/throttler`.
- CORS configured per environment.
- Authentication tokens stored in HTTP-only cookies, never localStorage.

## Environment Setup

```bash
# Install dependencies
npm install

# Start the API
npx nx serve api

# Start the web app
npx nx dev web

# Start the admin app
npx nx dev admin

# Run tests
npx nx run-many -t test

# Generate project graph
npx nx graph
```

## Key Decisions

- PostgreSQL with PostGIS for spatial queries (radius search, containment) and pgvector for semantic similarity search over location descriptions and POI data.
- Multi-provider AI via `ai-core` — the platform must not be locked to a single LLM provider.
- Serbian-first: default locale is `sr-Latn`, UI/UX designed for Serbian users with Cyrillic support.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
