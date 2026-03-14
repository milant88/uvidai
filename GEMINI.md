# GEMINI.md — Google Gemini / Jules Instructions for UvidAI

> This file provides context and coding rules for Google Gemini Code Assist and Jules when working on this repository.

## What is UvidAI?

UvidAI is an AI-powered hyper-local intelligence platform for Belgrade and Novi Sad, Serbia. It aggregates public data (business registry, cadastre, environmental sensors, schools, healthcare, transit) and exposes it through conversational AI agents. A user can ask about any address or micro-location and receive a unified analysis covering legal status, air quality, walkability, and nearby infrastructure.

## Repository Layout

This is an **Nx monorepo** (Nx 22, npm workspaces).

### Applications (`apps/`)

- `apps/web` — Public-facing Next.js 16 app (App Router, Server Components by default)
- `apps/admin` — Admin dashboard, Next.js 16 (App Router)
- `apps/api` — NestJS 11 backend API (REST + WebSocket for streaming)
- `apps/mobile` — React Native / Expo mobile client

### Packages (`packages/`)

- `packages/shared` — Shared TypeScript types, Zod validation schemas, constants. Import as `@uvidai/shared`.
- `packages/ai-core` — AI provider abstraction. All LLM, embedding, and agent orchestration calls must go through this package.
- `packages/data-connectors` — Typed adapters for external data sources (APR, GeoSrbija WFS, SEPA air quality, OpenStreetMap Overpass).
- `packages/i18n` — Internationalization. Supported locales: `sr-Latn` (default), `sr-Cyrl`, `en`, `ru`.

### Documentation (`docs/`)

- `docs/prompts/` — AI agent prompt templates stored as markdown.

## Tech Stack Summary

- **Monorepo**: Nx 22
- **Frontend**: Next.js 16, React 19, TanStack Query, Zustand, MapLibre GL JS, Tailwind CSS
- **Backend**: NestJS 11, Prisma ORM, class-validator
- **Database**: PostgreSQL with PostGIS (spatial) and pgvector (semantic search)
- **Cache**: Redis
- **Search**: Meilisearch
- **AI**: Vercel AI SDK, multi-provider abstraction in `packages/ai-core`
- **Testing**: Vitest, supertest, Playwright
- **i18n**: next-intl

## Coding Rules

### TypeScript

- Strict mode is enabled. Do not use `any`; prefer `unknown` with type narrowing or Zod parsing.
- Prefer `interface` for object shapes, `type` for unions and intersections.

### Naming Conventions

| Element                   | Convention       | Example                  |
| ------------------------- | ---------------- | ------------------------ |
| Files & directories       | kebab-case       | `air-quality.service.ts` |
| React components, classes | PascalCase       | `AirQualityCard`         |
| Functions, variables      | camelCase        | `fetchAirQuality`        |
| Constants                 | UPPER_SNAKE_CASE | `MAX_SEARCH_RADIUS`      |

### Imports

- Shared types: always import from `@uvidai/shared`.
- Group imports: node builtins, then external packages, then `@uvidai/*` workspace packages, then relative. Blank line between groups.

### Validation

- Runtime validation uses Zod schemas defined in `packages/shared/src/validation/`.
- NestJS DTOs use class-validator decorators for pipe-based validation.

### React & Next.js Rules

- Functional components only.
- Server Components by default; only add `'use client'` when browser APIs or hooks are needed.
- Data fetching: TanStack Query with typed query keys.
- Global state: Zustand. Local state: React hooks.
- Styling: Tailwind CSS (primary), CSS Modules (when scoped styles are needed).
- Maps: MapLibre GL JS.
- Translations: next-intl, all user-facing strings use i18n keys.
- Accessibility: all interactive elements must have appropriate aria attributes.

### NestJS Rules

- Feature-per-module: each module contains a controller, service, DTOs, and optional guards/interceptors.
- Database: Prisma ORM for all queries. Use raw SQL only for PostGIS spatial operations and pgvector similarity queries.
- OpenAPI: every endpoint must have `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators.
- Error handling: use NestJS exception filters, not try/catch in controllers.
- Rate limiting: `@nestjs/throttler` on public endpoints.

### AI Agent Code

- All provider calls (OpenAI, Gemini, Anthropic) go through `packages/ai-core`.
- Agent prompts are markdown files in `docs/prompts/`, loaded at runtime.
- Tool/function definitions must have Zod schemas for parameter validation.
- Every AI call must log: provider, model, input/output token count, latency.
- Streaming responses follow Vercel AI SDK patterns.
- Temperature and model are configurable per agent type.

## Architecture Constraints

1. **No direct LLM SDK calls from apps** — always use `packages/ai-core`.
2. **No direct external API calls from apps** — always use `packages/data-connectors`.
3. **No duplicated types** — shared types live in `packages/shared` only.
4. **No hardcoded strings** — user-facing text uses i18n keys from `packages/i18n`.
5. **No committed secrets** — all secrets via environment variables (`.env` files are gitignored).

## Testing Strategy

| Type            | Tool       | Location                                 |
| --------------- | ---------- | ---------------------------------------- |
| Unit            | Vitest     | `*.spec.ts` / `*.test.ts` next to source |
| API integration | supertest  | `apps/api/test/`                         |
| E2E             | Playwright | `apps/web-e2e/`, `apps/admin-e2e/`       |

```bash
npx nx run-many -t test          # all tests
npx nx affected -t test          # only affected
npx nx e2e web-e2e               # e2e for web
```

## Commit Convention

Conventional commits format:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code restructuring without behavior change
- `test:` — adding or updating tests
- `chore:` — tooling, dependencies, config

## Security Requirements

- Sanitize all user input.
- Use parameterized queries (Prisma default).
- API rate limiting on public endpoints.
- Auth tokens in HTTP-only cookies.
- CORS configured per deployment environment.
- Never store secrets in code or version control.

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
