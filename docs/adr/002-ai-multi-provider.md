# ADR-002: Multi-Provider AI Strategy with Cost-Optimized Routing

**Date:** 2026-03-13  
**Status:** Accepted

## Context

UvidAI's agent system makes frequent LLM calls across multiple sub-agents (Supervisor, Legal, Eco, Lifestyle, Price). Single-provider lock-in creates risk around pricing changes, rate limits, and outages. The system needs to balance cost, latency, and quality across different task types.

Cost projections for 1,000 daily conversations (~10 LLM calls each):
- GPT-4o exclusively: ~$15–25/day
- Gemini 2.0 Flash exclusively: ~$2–5/day
- Mixed routing: ~$4–8/day with quality preservation

## Decision

Adopt a **multi-provider strategy** with **LiteLLM** as the proxy/router layer:

1. **Default model: Gemini 2.0 Flash** — Used for 80%+ of calls (sub-agent routing, tool selection, simple Q&A). Offers the best cost/performance ratio for structured tasks.

2. **Fallback model: GPT-4o-mini** — Used for complex reasoning, nuanced Serbian language generation, and when Gemini returns low-confidence results.

3. **LiteLLM proxy** — Provides a unified OpenAI-compatible API that abstracts provider differences. Handles:
   - Cost-based routing
   - Automatic retries on provider failures
   - Rate limit management
   - Unified logging to Langfuse for observability

4. **Langfuse** for tracing — Every LLM call is traced with latency, token usage, cost, and quality metrics. Enables data-driven model selection refinement.

### Routing Rules

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Supervisor routing | Gemini Flash | Simple classification, low latency needed |
| Tool parameter extraction | Gemini Flash | Structured output, schema-constrained |
| Final response synthesis | Gemini Flash (default) / GPT-4o-mini (complex) | Cost vs quality tradeoff |
| Serbian language refinement | GPT-4o-mini | Better multilingual nuance |

## Consequences

**Positive:**
- 60-70% cost reduction vs. single premium model.
- No single-provider dependency — resilient to outages.
- Langfuse traces enable continuous optimization of routing rules.
- LiteLLM's OpenAI-compatible API means the codebase doesn't couple to any provider's SDK.

**Negative:**
- Additional infrastructure component (LiteLLM proxy).
- Routing logic adds complexity; wrong routing can degrade quality.
- Need to maintain API keys for multiple providers.

## Alternatives Considered

- **Single provider (Gemini only):** Simpler but creates vendor lock-in and no fallback on outages.
- **OpenRouter:** Managed proxy but adds a third-party dependency and markup on API costs.
- **Custom proxy:** Full control but significant maintenance overhead vs. LiteLLM's open-source solution.
