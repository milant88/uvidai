# ADR-003: Hybrid Deployment — Vercel Frontend + Hetzner VPS Backend

**Date:** 2026-03-13  
**Status:** Accepted

## Context

UvidAI consists of two distinct workloads with different deployment characteristics:

1. **Frontend (Next.js):** SSR/SSG pages, relatively stateless, benefits from edge CDN and zero-config deployment.
2. **Backend (NestJS):** Stateful services (WebSocket connections, background data ingestion, AI agent orchestration), requires persistent connections to PostgreSQL/Redis, and runs long-lived processes.

Deploying everything on a single platform forces compromises — either overpaying for serverless backend compute or losing edge optimization for the frontend.

## Decision

Use a **hybrid deployment model**:

### Frontend → Vercel
- Next.js deploys natively to Vercel with zero configuration.
- Automatic edge CDN, image optimization, and ISR support.
- Preview deployments per PR for stakeholder review.
- Free tier is sufficient for early-stage traffic.

### Backend → Hetzner VPS (Docker Compose → later Kubernetes)
- Single Hetzner CX32 VPS (~€8/month) runs all backend services via Docker Compose:
  - NestJS API
  - PostgreSQL + PostGIS + pgvector
  - Redis
  - Meilisearch
  - LiteLLM proxy
  - Langfuse
- Provides full control over resource allocation and persistent connections.
- Scales vertically initially; migrates to Kubernetes (k3s) when traffic demands it.

### Networking
- Frontend calls backend via HTTPS (Hetzner VPS has a public IP with Caddy/Traefik as reverse proxy).
- WebSocket connections go directly to the backend.
- CORS configured to allow Vercel preview and production domains.

### Migration Path
1. **Phase 1 (MVP):** Single VPS with Docker Compose.
2. **Phase 2 (Scale):** Add k3s for container orchestration on the same or additional VPS nodes.
3. **Phase 3 (Growth):** Consider managed Kubernetes or split heavy workloads to dedicated services.

## Consequences

**Positive:**
- Optimized cost: ~€8/month backend + $0 frontend (Vercel free tier) for MVP.
- Each platform plays to its strengths — Vercel for frontend DX, VPS for backend flexibility.
- Full control over backend infrastructure for data-heavy and long-running AI processes.

**Negative:**
- Two deployment targets to manage instead of one.
- Network latency between Vercel edge and Hetzner VPS (mitigated by Hetzner's EU-Central location matching target users in Serbia).
- Must handle SSL/TLS certificates and reverse proxy configuration manually on VPS.

## Alternatives Considered

- **Full Vercel (including API routes):** Limited to serverless functions; not suitable for WebSockets, background workers, or heavy data processing.
- **Full Hetzner (including frontend):** Loses Vercel's edge CDN, preview deployments, and zero-config Next.js features.
- **Railway/Render:** Higher cost than Hetzner for equivalent compute; less control over infrastructure.
