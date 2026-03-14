// ---------------------------------------------------------------------------
// AI Provider abstraction layer
// ---------------------------------------------------------------------------

/** Role in a chat turn */
export type ChatRole = 'user' | 'assistant' | 'system' | 'function';

/** A single message in a chat completion request */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Function/tool name when role is 'function' */
  name?: string;
}

/** Tool/function declaration the model can call */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for parameters */
  parameters: Record<string, unknown>;
}

/** A tool call requested by the model */
export interface ToolCall {
  id: string;
  name: string;
  /** JSON-encoded arguments */
  arguments: string;
}

/** Response from a chat completion */
export interface ChatResponse {
  /** Text content of the response */
  content: string;
  /** Tool calls the model wants to make (if any) */
  toolCalls?: ToolCall[];
  /** Reason the model stopped */
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Raw provider-specific response for debugging */
  raw?: unknown;
}

/** Response from an embedding request */
export interface EmbeddingResponse {
  /** The embedding vector */
  embedding: number[];
  /** Dimensionality of the vector */
  dimensions: number;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/** Configuration for an AI provider instance */
export interface AIProviderConfig {
  /** Provider identifier (e.g. 'gemini', 'openai') */
  provider: string;
  /** API key or credential */
  apiKey: string;
  /** Model ID for chat completions */
  chatModel: string;
  /** Model ID for embeddings (optional) */
  embeddingModel?: string;
  /** Base URL override */
  baseUrl?: string;
  /** Default temperature (0 – 2) */
  temperature?: number;
  /** Max tokens for completion */
  maxTokens?: number;
}

/**
 * Unified interface for AI providers.
 *
 * Implementations wrap provider-specific SDKs (Gemini, OpenAI, etc.)
 * behind this common contract so the agent layer stays provider-agnostic.
 */
export interface AIProvider {
  readonly name: string;

  /** Send a chat completion request */
  chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      tools?: ToolDefinition[];
      systemPrompt?: string;
    },
  ): Promise<ChatResponse>;

  /** Generate an embedding for the given text */
  embed(text: string): Promise<EmbeddingResponse>;

  /** Generate embeddings for multiple texts in a single batch */
  embedBatch(texts: string[]): Promise<EmbeddingResponse[]>;
}

export { GeminiProvider } from './gemini-provider.js';
export { LiteLLMProvider } from './litellm-provider.js';
