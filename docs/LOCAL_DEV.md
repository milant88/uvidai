# Local full stack

## Ports

| Service | Port | Command |
|---------|------|---------|
| Nest API | **3000** | `pnpm dev:api` |
| Web (Next) | **4200** | `pnpm dev:web` |
| Admin (Next) | **4300** | `pnpm dev:admin` |
| PostgreSQL | **5432** | `pnpm db:up` (Docker) |

## One-time setup

1. Copy `.env.example` → `.env` (repo root and/or `apps/api/.env`).
2. Start Postgres: `pnpm db:up` (requires Docker), or point `DATABASE_URL` at your own instance.
3. Apply schema: `pnpm db:push`
4. Optional: set `GEMINI_API_KEY` for real AI replies (otherwise API returns a placeholder).

## Run apps (three terminals)

```bash
pnpm dev:api      # http://localhost:3000  — Swagger: /api/docs
pnpm dev:web      # http://localhost:4200
pnpm dev:admin    # http://localhost:4300
```

Web uses **same-origin** `/api/v1/*` rewrites to the API (see `apps/web/next.config.js`). Override with `NEXT_PUBLIC_API_URL=http://localhost:3000` only if needed.

## Production build

Use a normal `NODE_ENV` (avoid `development` when running `next build`):

```powershell
$env:NODE_ENV="production"; pnpm exec nx run-many -t build -p api web admin
```

Or: `pnpm build:all` (sets `NODE_ENV=production` via `cross-env`; avoids Next.js prerender failures from a non-standard `NODE_ENV` in your shell).

## Prisma

- `pnpm db:push` — sync schema (dev)
- `pnpm exec prisma generate --schema=apps/api/prisma/schema.prisma` — regenerate client

## Troubleshooting

### `EADDRINUSE` / port 4200 (or 4300) already in use

A previous `next dev` is still bound to that port (or another app uses it).

**Windows PowerShell — find PID and stop:**

```powershell
Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess
Stop-Process -Id <PID> -Force
```

**Use another port:**

```bash
pnpm exec nx dev web -- --port 4201
pnpm exec nx dev admin -- --port 4301
```

### Exit code **130**

Usually **Ctrl+C** (SIGINT). If you did not interrupt, scroll up for an earlier error (port conflict, compile failure).
