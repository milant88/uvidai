import type { AIProvider, ChatMessage } from '../providers/index.js';
import type { AgentContext, RoutingDecision } from './index.js';
import { AgentType } from './index.js';
import type { AgentResponse } from './chat-agent.js';
import { ChatAgent } from './chat-agent.js';
import { SupervisorAgent } from './supervisor.js';
import {
  createEcoAgent,
  createLifestyleAgent,
  createLegalAgent,
  createGeneralAgent,
} from './specialist-agents.js';

export interface OrchestratorResponse {
  content: string;
  agentsUsed: AgentType[];
  toolCallsHistory: Array<{
    agent: AgentType;
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  routingDecision: RoutingDecision;
}

const SYNTHESIS_SYSTEM_PROMPT = `You are the UvidAI Supervisor synthesizing responses from multiple specialist agents into one coherent answer.

Combine the specialist outputs into a well-structured response using these sections when applicable:
- 📍 Lokacija: resolved address
- 🌿 Životna sredina: environmental findings
- 🏘️ Infrastruktura i lifestyle: amenities and livability
- 🏛️ Pravni status: legal/company findings
- 📊 Rezime: your synthesis — the "so what" for the user

Rules:
- Preserve all data and specifics from each agent. Don't drop numbers or details.
- Use the same language as the original query.
- If agents contradict each other, note both perspectives.
- Keep it concise but comprehensive.`;

export class AgentOrchestrator {
  private readonly supervisor: SupervisorAgent;
  private readonly agents: Map<AgentType, ChatAgent>;

  constructor(private readonly provider: AIProvider) {
    this.supervisor = new SupervisorAgent(provider);
    this.agents = new Map<AgentType, ChatAgent>([
      [AgentType.Environment, createEcoAgent(provider)],
      [AgentType.Lifestyle, createLifestyleAgent(provider)],
      [AgentType.LegalCheck, createLegalAgent(provider)],
      [AgentType.General, createGeneralAgent(provider)],
    ]);
  }

  async processQuery(
    context: AgentContext,
    userMessage: string,
  ): Promise<OrchestratorResponse> {
    const routingDecision = await this.supervisor.route(context, userMessage);

    const enrichedContext: AgentContext = {
      ...context,
      location: routingDecision.location ?? context.location,
    };

    let locationPrefix = '';
    if (routingDecision.location?.address && !routingDecision.location.lat) {
      locationPrefix =
        `The user is asking about the location: "${routingDecision.location.address}". ` +
        `Use the geocode_address tool first to get coordinates, then use other tools.\n\n`;
    }

    const agentTypes = routingDecision.agents;
    const agentResults = await this.executeAgents(
      agentTypes,
      enrichedContext,
      locationPrefix + userMessage,
    );

    const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const allToolCalls: OrchestratorResponse['toolCallsHistory'] = [];
    const agentOutputs: Array<{ type: AgentType; content: string }> = [];

    for (const { type, response } of agentResults) {
      totalUsage.promptTokens += response.usage.promptTokens;
      totalUsage.completionTokens += response.usage.completionTokens;
      totalUsage.totalTokens += response.usage.totalTokens;

      for (const tc of response.toolCallsHistory) {
        allToolCalls.push({ agent: type, ...tc });
      }

      agentOutputs.push({ type, content: response.content });
    }

    let finalContent: string;

    if (agentOutputs.length === 1) {
      finalContent = agentOutputs[0].content;
    } else if (agentOutputs.length > 1) {
      const synthesized = await this.synthesize(
        context,
        userMessage,
        agentOutputs,
      );
      finalContent = synthesized.content;
      totalUsage.promptTokens += synthesized.usage.promptTokens;
      totalUsage.completionTokens += synthesized.usage.completionTokens;
      totalUsage.totalTokens += synthesized.usage.totalTokens;
    } else {
      finalContent = 'No agents were able to process this query. Please try rephrasing.';
    }

    return {
      content: finalContent,
      agentsUsed: agentTypes,
      toolCallsHistory: allToolCalls,
      totalUsage,
      routingDecision,
    };
  }

  private async executeAgents(
    agentTypes: AgentType[],
    context: AgentContext,
    userMessage: string,
  ): Promise<Array<{ type: AgentType; response: AgentResponse }>> {
    const tasks = agentTypes.map(async (type) => {
      const agent = this.agents.get(type);
      if (!agent) {
        console.warn(`No agent registered for type: ${type}`);
        return null;
      }

      try {
        const response = await agent.run(context, userMessage);
        return { type, response };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Agent ${type} failed: ${message}`);
        return {
          type,
          response: {
            content: `Agent ${type} encountered an error: ${message}`,
            toolCallsHistory: [],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          } satisfies AgentResponse,
        };
      }
    });

    const results = await Promise.all(tasks);
    return results.filter(
      (r): r is { type: AgentType; response: AgentResponse } => r !== null,
    );
  }

  private async synthesize(
    context: AgentContext,
    userMessage: string,
    agentOutputs: Array<{ type: AgentType; content: string }>,
  ): Promise<AgentResponse> {
    const combinedInput = agentOutputs
      .map(
        (o) =>
          `--- ${agentTypeLabel(o.type)} ---\n${o.content}`,
      )
      .join('\n\n');

    const messages: ChatMessage[] = [
      ...context.history.slice(-4),
      { role: 'user', content: userMessage },
      {
        role: 'assistant',
        content: `I gathered data from multiple specialists. Here are their responses:\n\n${combinedInput}`,
      },
      {
        role: 'user',
        content:
          'Now synthesize these specialist responses into a single coherent answer for the user. ' +
          'Preserve all data and specifics. Respond in the same language as the original query.',
      },
    ];

    const response = await this.provider.chat(messages, {
      systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 4096,
    });

    return {
      content: response.content,
      toolCallsHistory: [],
      usage: response.usage,
    };
  }
}

function agentTypeLabel(type: AgentType): string {
  switch (type) {
    case AgentType.Environment:
      return 'Eco / Environment Agent';
    case AgentType.Lifestyle:
      return 'Lifestyle Agent';
    case AgentType.LegalCheck:
      return 'Legal Agent';
    case AgentType.General:
      return 'General Agent';
    default:
      return type;
  }
}
