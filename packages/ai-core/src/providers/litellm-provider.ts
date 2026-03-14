import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  ToolDefinition,
  ToolCall,
} from './index.js';

const DEFAULT_BASE_URL = 'http://localhost:4000';

interface OpenAIToolCallResponse {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenAIToolCallResponse[];
  };
  finish_reason: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIChatResponse {
  id: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

export class LiteLLMProvider implements AIProvider {
  readonly name = 'litellm';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly defaultTemperature: number | undefined;
  private readonly defaultMaxTokens: number | undefined;

  constructor(config: AIProviderConfig) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.chatModel = config.chatModel;
    this.embeddingModel = config.embeddingModel ?? config.chatModel;
    this.defaultTemperature = config.temperature;
    this.defaultMaxTokens = config.maxTokens;
  }

  async chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      tools?: ToolDefinition[];
      systemPrompt?: string;
    },
  ): Promise<ChatResponse> {
    const openaiMessages = buildMessages(messages, options?.systemPrompt);

    const body: Record<string, unknown> = {
      model: this.chatModel,
      messages: openaiMessages,
      temperature: options?.temperature ?? this.defaultTemperature,
      max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
    };

    if (options?.tools?.length) {
      body['tools'] = options.tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const data = await this.post<OpenAIChatResponse>(
      '/chat/completions',
      body,
    );

    const choice = data.choices[0];
    if (!choice) {
      throw new Error('LiteLLM returned no choices');
    }

    const toolCalls: ToolCall[] | undefined = choice.message.tool_calls?.map(
      (tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      }),
    );

    return {
      content: choice.message.content ?? '',
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      finishReason: mapFinishReason(choice.finish_reason),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      raw: data,
    };
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    const data = await this.post<OpenAIEmbeddingResponse>('/embeddings', {
      model: this.embeddingModel,
      input: text,
    });

    const vec = data.data[0]?.embedding ?? [];

    return {
      embedding: vec,
      dimensions: vec.length,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    const data = await this.post<OpenAIEmbeddingResponse>('/embeddings', {
      model: this.embeddingModel,
      input: texts,
    });

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          totalTokens: data.usage.total_tokens,
        },
      }));
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error');
      throw new Error(
        `LiteLLM request failed: ${response.status} ${response.statusText} — ${text}`,
      );
    }

    return (await response.json()) as T;
  }
}

function buildMessages(
  messages: ChatMessage[],
  systemPrompt?: string,
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    const entry: Record<string, unknown> = {
      role: msg.role === 'function' ? 'tool' : msg.role,
      content: msg.content,
    };
    if (msg.name) {
      entry['name'] = msg.name;
    }
    result.push(entry);
  }

  return result;
}

function mapFinishReason(
  reason: string,
): ChatResponse['finishReason'] {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'tool_calls':
      return 'tool_calls';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content_filter';
    default:
      return 'stop';
  }
}
