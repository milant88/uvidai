import type {
  AIProvider,
  ChatMessage,
  ChatResponse,
  ToolDefinition,
} from '../providers/index.js';
import type { AgentContext } from './index.js';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ChatAgentOptions {
  provider: AIProvider;
  systemPrompt: string;
  tools?: AgentTool[];
  maxToolRounds?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  content: string;
  toolCallsHistory: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const DEFAULT_MAX_TOOL_ROUNDS = 5;

export class ChatAgent {
  constructor(private readonly options: ChatAgentOptions) {}

  async run(context: AgentContext, userMessage: string): Promise<AgentResponse> {
    const maxRounds = this.options.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;

    const toolDefs: ToolDefinition[] | undefined = this.options.tools?.map(
      (t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }),
    );

    const toolMap = new Map<string, AgentTool>();
    for (const t of this.options.tools ?? []) {
      toolMap.set(t.name, t);
    }

    const messages: ChatMessage[] = [
      ...context.history,
      { role: 'user', content: userMessage },
    ];

    const toolCallsHistory: AgentResponse['toolCallsHistory'] = [];
    const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for (let round = 0; round < maxRounds; round++) {
      const response: ChatResponse = await this.options.provider.chat(
        messages,
        {
          systemPrompt: this.options.systemPrompt,
          temperature: this.options.temperature,
          maxTokens: this.options.maxTokens,
          tools: toolDefs,
        },
      );

      accumulateUsage(totalUsage, response.usage);

      if (
        response.finishReason !== 'tool_calls' ||
        !response.toolCalls?.length
      ) {
        return {
          content: response.content,
          toolCallsHistory,
          usage: totalUsage,
        };
      }

      messages.push({
        role: 'assistant',
        content: response.content || '',
      });

      for (const tc of response.toolCalls) {
        const tool = toolMap.get(tc.name);
        if (!tool) {
          const errorResult = { error: `Unknown tool: ${tc.name}` };
          messages.push({
            role: 'function',
            name: tc.name,
            content: JSON.stringify(errorResult),
          });
          toolCallsHistory.push({
            name: tc.name,
            args: parseArgs(tc.arguments),
            result: errorResult,
          });
          continue;
        }

        const args = parseArgs(tc.arguments);
        let result: unknown;

        try {
          result = await tool.execute(args);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : String(err);
          result = { error: message };
        }

        messages.push({
          role: 'function',
          name: tc.name,
          content: JSON.stringify(result),
        });

        toolCallsHistory.push({ name: tc.name, args, result });
      }
    }

    const finalResponse = await this.options.provider.chat(messages, {
      systemPrompt: this.options.systemPrompt,
      temperature: this.options.temperature,
      maxTokens: this.options.maxTokens,
    });

    accumulateUsage(totalUsage, finalResponse.usage);

    return {
      content: finalResponse.content,
      toolCallsHistory,
      usage: totalUsage,
    };
  }
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function accumulateUsage(
  total: AgentResponse['usage'],
  delta: ChatResponse['usage'],
): void {
  total.promptTokens += delta.promptTokens;
  total.completionTokens += delta.completionTokens;
  total.totalTokens += delta.totalTokens;
}
