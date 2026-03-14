import type { ToolDefinition, ChatMessage } from '../providers/index.js';

// ---------------------------------------------------------------------------
// Agent types
// ---------------------------------------------------------------------------

/** Specialised agent types corresponding to app modules */
export enum AgentType {
  LegalCheck = 'legal_check',
  Environment = 'environment',
  Lifestyle = 'lifestyle',
  PriceRadar = 'price_radar',
  NeighborhoodScore = 'neighborhood_score',
  Transport = 'transport',
  BusinessScanner = 'business_scanner',
  /** Orchestrator that routes to specialised agents */
  Router = 'router',
  /** General-purpose assistant */
  General = 'general',
}

/** Configuration for a specialised agent */
export interface AgentConfig {
  type: AgentType;
  /** Human-readable name */
  displayName: string;
  /** System prompt template — may contain {{variable}} placeholders */
  systemPrompt: string;
  /** Tools this agent is allowed to use */
  tools: ToolDefinition[];
  /** Model override (defaults to provider's chatModel) */
  model?: string;
  /** Temperature override */
  temperature?: number;
  /** Max completion tokens override */
  maxTokens?: number;
}

/** Result of the router agent deciding which specialist to invoke */
export interface RoutingDecision {
  /** The agent(s) to forward the query to */
  agents: AgentType[];
  /** Extracted location context, if any */
  location?: { address?: string; lat?: number; lng?: number };
  /** Brief reasoning for the routing choice */
  reasoning: string;
}

/** Conversation context passed into agents */
export interface AgentContext {
  /** Current conversation history (trimmed to fit context window) */
  history: ChatMessage[];
  /** Active locale for response language */
  locale: string;
  /** Location the user is asking about */
  location?: { address?: string; lat?: number; lng?: number };
  /** ID of the current conversation */
  conversationId?: string;
  /** User ID */
  userId?: string;
}

export {
  ChatAgent,
  type AgentTool,
  type ChatAgentOptions,
  type AgentResponse,
} from './chat-agent.js';

export { SupervisorAgent } from './supervisor.js';
export {
  AgentOrchestrator,
  type OrchestratorResponse,
} from './orchestrator.js';
export {
  createEcoAgent,
  createLifestyleAgent,
  createLegalAgent,
  createGeneralAgent,
} from './specialist-agents.js';
export {
  createPoiSearchTool,
  createAirQualityTool,
  createGeocodeTool,
  createCompanySearchTool,
} from './tools/index.js';
