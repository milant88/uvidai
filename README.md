# UvidAI - AI-Powered Hyper-Local Intelligence Platform

Intelligent agent that integrates publicly available data (APR, Cadastre, Ecology, Social Infrastructure) for Belgrade and Novi Sad into a unified interface. Ask in natural language, get a complete picture of any micro-location.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Fill in your API keys (at minimum: GEMINI_API_KEY)

# 3. Start infrastructure (PostgreSQL, Redis, Meilisearch, Langfuse, LiteLLM)
docker compose up -d

# 4. Apply DB schema (with Postgres running)
pnpm db:push

# 5. Start each app (separate terminals)
pnpm dev:api      # API — http://localhost:3000
pnpm dev:web      # Web — http://localhost:4200
pnpm dev:admin    # Admin — http://localhost:4300
```

## Architecture

| Component | Stack | Location |
|-----------|-------|----------|
| Web App | Next.js 16, MapLibre GL, Vercel AI SDK | `apps/web` |
| Admin Dashboard | Next.js 16, Tremor, shadcn/ui | `apps/admin` |
| API | NestJS 11, Prisma, BullMQ | `apps/api` |
| Mobile | Expo / React Native | `apps/mobile` |
| Shared Types | TypeScript, Zod | `packages/shared` |
| AI Core | LangGraph.js, multi-provider | `packages/ai-core` |
| Data Connectors | OSM, APR, SEPA, GeoSrbija | `packages/data-connectors` |
| i18n | sr-Latn, sr-Cyrl, en, ru | `packages/i18n` |

## Key Commands

```bash
pnpm dev:api             # Start API (or: pnpm nx serve api)
pnpm dev:web             # Start web on :4200
pnpm dev:admin           # Start admin on :4300
pnpm nx dev web          # Same as dev:web without fixed port in script
pnpm nx build web        # Production build
pnpm nx test shared      # Run tests for shared package
pnpm nx graph            # Visualize project dependency graph
pnpm nx affected -t test # Test only affected projects
```

## Documentation

- [Business Requirements](BRD.md)
- [Architecture Decision Records](docs/adr/)
- [API Specification](docs/openapi/uvidai-api.yaml)
- [Database Schema](docs/data-dictionary/schema.md)
- [Agent Prompts](docs/prompts/)
- [Evaluation Golden Set](docs/eval/golden-set.jsonl)

## Localization

Supported languages: Serbian Latin (default), Serbian Cyrillic, English, Russian.

## License

MIT
