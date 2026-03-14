# ADR-001: Nx Monorepo with Next.js + NestJS

**Date:** 2026-03-13  
**Status:** Accepted

## Context

UvidAI requires a frontend (conversational UI with map visualizations), a backend API (data ingestion, AI orchestration, geocoding), and shared code (types, validation schemas, constants). Managing these as separate repositories would introduce friction around versioning, type drift, and deployment coordination.

Key considerations:
- The frontend is a Next.js app (SSR, React Server Components, Vercel deployment).
- The backend is a NestJS API (REST + WebSocket, agent orchestration, heavy data processing).
- Shared packages include TypeScript types, Zod schemas, and utility functions.
- A solo/small-team developer needs minimal overhead to ship features across the stack.

## Decision

Use **Nx** as the monorepo build system with the following project structure:

```
apps/
  web/          → Next.js frontend
  api/          → NestJS backend
packages/
  shared/       → Shared types, schemas, constants
  ai-tools/     → AI agent tool definitions
  db/           → Drizzle ORM schema and migrations
```

Nx provides:
- **Task orchestration** with caching (local + Nx Cloud remote cache).
- **Dependency graph awareness** — only rebuild/test what changed.
- **Code generators** for consistent scaffolding.
- **Implicit dependency tracking** between apps and packages via TypeScript path aliases.

## Consequences

**Positive:**
- Single `git clone` to get the entire stack. Shared types enforce compile-time contracts between frontend and backend.
- Nx's computation caching reduces CI time significantly for incremental changes.
- Atomic commits across frontend + backend + shared when features span the stack.

**Negative:**
- Slightly steeper initial setup compared to standalone repos.
- Nx configuration files add some boilerplate.
- CI pipelines must be Nx-aware (use `nx affected` to avoid unnecessary builds).

## Alternatives Considered

- **Turborepo:** Simpler but less capable task orchestration, weaker code generation support.
- **Separate repos + npm packages:** Maximum isolation but high coordination overhead for a solo developer.
- **pnpm workspaces (no orchestrator):** Lacks task caching and affected analysis.
