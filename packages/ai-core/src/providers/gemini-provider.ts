import { GoogleGenAI, type Content, type Part } from '@google/genai';
import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatResponse,
  EmbeddingResponse,
  ToolDefinition,
} from './index.js';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenAI;
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly defaultTemperature: number | undefined;
  private readonly defaultMaxTokens: number | undefined;

  constructor(config: AIProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.chatModel = config.chatModel;
    this.embeddingModel = config.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;
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
    const contents = messagesToContents(messages);

    const tools =
      options?.tools?.length
        ? [
            {
              functionDeclarations: options.tools.map((t) => ({
                name: t.name,
                description: t.description,
                parametersJsonSchema: t.parameters,
              })),
            },
          ]
        : undefined;

    const response = await this.client.models.generateContent({
      model: this.chatModel,
      contents,
      config: {
        systemInstruction: options?.systemPrompt,
        temperature: options?.temperature ?? this.defaultTemperature,
        maxOutputTokens: options?.maxTokens ?? this.defaultMaxTokens,
        tools,
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const textParts: string[] = [];
    const toolCalls: ChatResponse['toolCalls'] = [];

    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      }
      if (part.functionCall) {
        toolCalls.push({
          id: part.functionCall.id ?? crypto.randomUUID(),
          name: part.functionCall.name ?? '',
          arguments: JSON.stringify(part.functionCall.args ?? {}),
        });
      }
    }

    const usage = response.usageMetadata;

    return {
      content: textParts.join(''),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: mapFinishReason(candidate?.finishReason),
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
      },
      raw: response,
    };
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    const response = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: text,
    });

    const values = response.embeddings?.[0]?.values ?? [];

    return {
      embedding: values,
      dimensions: values.length,
      usage: {
        promptTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    const response = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: texts.map((t) => ({ role: 'user', parts: [{ text: t }] })),
    });

    return (response.embeddings ?? []).map((emb) => {
      const values = emb.values ?? [];
      return {
        embedding: values,
        dimensions: values.length,
        usage: { promptTokens: 0, totalTokens: 0 },
      };
    });
  }
}

function messagesToContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;

    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: Part[] = [];

    if (msg.role === 'function' && msg.name) {
      parts.push({
        functionResponse: {
          name: msg.name,
          response: safeParse(msg.content),
        },
      });
    } else {
      parts.push({ text: msg.content });
    }

    contents.push({ role, parts });
  }

  return contents;
}

function safeParse(json: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return { result: parsed };
  } catch {
    return { result: json };
  }
}

function mapFinishReason(
  reason: string | undefined,
): ChatResponse['finishReason'] {
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
    case 'RECITATION':
    case 'BLOCKLIST':
    case 'PROHIBITED_CONTENT':
    case 'SPII':
      return 'content_filter';
    default:
      return reason === 'STOP' ? 'stop' : 'stop';
  }
}
