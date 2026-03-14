import type { AIProvider, ChatMessage } from '../providers/index.js';
import type { AgentContext, RoutingDecision } from './index.js';
import { AgentType } from './index.js';

const SUPERVISOR_SYSTEM_PROMPT = `You are the UvidAI Supervisor Agent, an intelligent orchestrator for location analysis in Belgrade and Novi Sad, Serbia.

Your job is to analyze the user's query and decide which specialist agent(s) should handle it.

## Available Agents

- **environment**: Air quality (SEPA/xEco), pollution, environmental conditions, noise, green spaces.
- **lifestyle**: POIs (schools, kindergartens, hospitals, pharmacies, transit, restaurants), walkability, neighborhood amenities, "what's it like to live here."
- **legal_check**: Company verification (APR), business registry lookups, entity legal status, account blocks.
- **general**: General questions about Belgrade/Novi Sad, real estate advice, or anything that doesn't fit the specialists.

## Instructions

Analyze the user message and respond with ONLY a JSON object (no markdown, no explanation):

{
  "agents": ["agent_type_1", "agent_type_2"],
  "location": { "address": "extracted address if mentioned", "lat": null, "lng": null },
  "reasoning": "brief one-line explanation of your routing choice"
}

## Routing Rules

1. Multi-agent queries are common. "Kakav je stan u ulici X?" needs environment + lifestyle. Route to ALL relevant agents.
2. If the user mentions a location/address, extract it into the "location" field.
3. If coordinates are provided in the conversation context, include them in location.
4. Default to "general" if the intent is unclear or doesn't match a specialist.
5. For company/investor questions, route to "legal_check".
6. For air quality or pollution, route to "environment".
7. For amenities, schools, transit, or walkability, route to "lifestyle".
8. You can route to multiple agents simultaneously.`;

export class SupervisorAgent {
  constructor(private readonly provider: AIProvider) {}

  async route(
    context: AgentContext,
    userMessage: string,
  ): Promise<RoutingDecision> {
    const messages: ChatMessage[] = [
      ...context.history.slice(-6),
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await this.provider.chat(messages, {
        systemPrompt: SUPERVISOR_SYSTEM_PROMPT,
        temperature: 0.1,
        maxTokens: 512,
      });

      return parseRoutingResponse(response.content, context);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Supervisor routing failed, defaulting to general: ${message}`);
      return {
        agents: [AgentType.General],
        location: context.location,
        reasoning: `Routing failed (${message}), falling back to general agent`,
      };
    }
  }
}

const VALID_AGENT_TYPES = new Set<string>(Object.values(AgentType));

function parseRoutingResponse(
  content: string,
  context: AgentContext,
): RoutingDecision {
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed: {
    agents?: string[];
    location?: { address?: string; lat?: number | null; lng?: number | null };
    reasoning?: string;
  };

  try {
    parsed = JSON.parse(cleaned) as typeof parsed;
  } catch {
    return {
      agents: [AgentType.General],
      location: context.location,
      reasoning: 'Could not parse supervisor response, falling back to general',
    };
  }

  const agents: AgentType[] = (parsed.agents ?? [])
    .filter((a) => VALID_AGENT_TYPES.has(a))
    .map((a) => a as AgentType);

  if (agents.length === 0) {
    agents.push(AgentType.General);
  }

  const location = parsed.location
    ? {
        address: parsed.location.address ?? context.location?.address,
        lat: parsed.location.lat ?? context.location?.lat,
        lng: parsed.location.lng ?? context.location?.lng,
      }
    : context.location;

  return {
    agents,
    location: location
      ? {
          address: location.address,
          lat: location.lat ?? undefined,
          lng: location.lng ?? undefined,
        }
      : undefined,
    reasoning: parsed.reasoning ?? 'No reasoning provided',
  };
}
