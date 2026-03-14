// ---------------------------------------------------------------------------
// Core domain types — the contract between frontend and backend
// ---------------------------------------------------------------------------

/** WGS-84 coordinate pair */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** A named location with optional metadata */
export interface Location {
  /** Internal identifier */
  id: string;
  /** Human-readable address */
  address: string;
  coordinates: Coordinates;
  /** Municipality / opština */
  municipality?: string;
  /** City / grad */
  city?: string;
  /** Postal code */
  postalCode?: string;
  /** Country ISO 3166-1 alpha-2 (default "RS") */
  country: string;
}

// ---------------------------------------------------------------------------
// Points of Interest
// ---------------------------------------------------------------------------

/** OSM amenity categories relevant to the app */
export type POICategory =
  | 'school'
  | 'kindergarten'
  | 'hospital'
  | 'doctors'
  | 'pharmacy'
  | 'bank'
  | 'post_office'
  | 'supermarket'
  | 'park'
  | 'restaurant'
  | 'cafe'
  | 'bus_station'
  | 'tram_stop'
  | 'parking'
  | 'fuel'
  | 'gym'
  | 'library'
  | 'place_of_worship';

/** A single Point of Interest */
export interface POI {
  id: string;
  /** OSM node/way ID if sourced from OSM */
  osmId?: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates;
  /** Distance from the queried location in metres */
  distanceMeters?: number;
  /** Free-form tags from OSM */
  tags?: Record<string, string>;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

// ---------------------------------------------------------------------------
// Air Quality / Environment
// ---------------------------------------------------------------------------

/** SEPA / xEco air quality index category */
export type AQICategory = 'excellent' | 'good' | 'acceptable' | 'polluted' | 'very_polluted';

/** Air quality reading for a monitoring station */
export interface AirQuality {
  stationId: string;
  stationName: string;
  coordinates: Coordinates;
  /** Overall AQI value (0 – 500+) */
  aqi: number;
  category: AQICategory;
  /** ISO-8601 timestamp of the reading */
  measuredAt: string;
  /** Particulate matter ≤ 2.5 µm (µg/m³) */
  pm25?: number;
  /** Particulate matter ≤ 10 µm (µg/m³) */
  pm10?: number;
  /** Nitrogen dioxide (µg/m³) */
  no2?: number;
  /** Sulphur dioxide (µg/m³) */
  so2?: number;
  /** Ozone (µg/m³) */
  o3?: number;
  /** Carbon monoxide (mg/m³) */
  co?: number;
  /** Distance from queried location in metres */
  distanceMeters?: number;
}

// ---------------------------------------------------------------------------
// APR / Company
// ---------------------------------------------------------------------------

/** Legal form of a company registered at APR */
export type CompanyLegalForm = 'doo' | 'ad' | 'preduzetnik' | 'zd' | 'kd' | 'od' | 'other';

/** Current status of a company */
export type CompanyStatus = 'active' | 'in_bankruptcy' | 'in_liquidation' | 'deleted' | 'blocked';

/** Company entity from APR (Agencija za privredne registre) */
export interface Company {
  /** APR matični broj */
  registrationNumber: string;
  /** PIB (tax identification number) */
  taxId: string;
  name: string;
  legalForm: CompanyLegalForm;
  status: CompanyStatus;
  /** Full registered address */
  address?: string;
  /** Date of incorporation (ISO-8601) */
  foundedAt?: string;
  /** Activity code (šifra delatnosti) */
  activityCode?: string;
  activityDescription?: string;
  /** Whether the company account is currently blocked */
  isBlocked: boolean;
  /** Number of days blocked in the last 365 days */
  blockedDaysLastYear?: number;
  /** Legal representative name */
  representative?: string;
}

// ---------------------------------------------------------------------------
// Cadastral / GeoSrbija
// ---------------------------------------------------------------------------

/** Parcel info from GeoSrbija / RGZ */
export interface Parcel {
  /** Cadastral parcel number */
  parcelNumber: string;
  /** Cadastral municipality name */
  cadastralMunicipality: string;
  /** Area in m² */
  area?: number;
  /** Current land use type */
  landUse?: string;
  /** Encumbrances / zabeležbe */
  encumbrances?: string[];
  /** Owner name(s) if publicly available */
  owners?: string[];
}

// ---------------------------------------------------------------------------
// Conversations & Messages
// ---------------------------------------------------------------------------

/** Which module/agent originated the message */
export type ModuleName =
  | 'legal_check'
  | 'environment'
  | 'lifestyle'
  | 'price_radar'
  | 'neighborhood_score'
  | 'transport'
  | 'business_scanner'
  | 'general';

export type MessageRole = 'user' | 'assistant' | 'system';

/** A single message within a conversation */
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  /** Structured data payload (POIs, air quality, etc.) attached to this message */
  attachments?: MessageAttachment[];
  /** The module that handled this message */
  module?: ModuleName;
  /** ISO-8601 timestamp */
  createdAt: string;
  /** Token usage metadata */
  tokenUsage?: TokenUsage;
}

/** Structured attachment on a message */
export interface MessageAttachment {
  type: 'poi_list' | 'air_quality' | 'company_info' | 'parcel_info' | 'map_marker' | 'chart';
  /** JSON-serialisable payload */
  data: unknown;
  /** Optional human-readable label */
  label?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** A conversation session */
export interface Conversation {
  id: string;
  /** User who owns the conversation */
  userId: string;
  title?: string;
  /** The location this conversation is about, if any */
  location?: Location;
  messages: Message[];
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Feedback & Ratings
// ---------------------------------------------------------------------------

export type FeedbackSentiment = 'positive' | 'negative' | 'neutral';

/** End-user feedback on a single message */
export interface Feedback {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  sentiment: FeedbackSentiment;
  comment?: string;
  createdAt: string;
}

/** Admin quality rating for fine-tuning curation */
export interface AdminRating {
  id: string;
  messageId: string;
  conversationId: string;
  /** Admin user who rated */
  ratedBy: string;
  /** 1 – 5 scale */
  score: number;
  /** Optional correction of the assistant response */
  correctedResponse?: string;
  /** Tags for categorising quality issues */
  tags?: string[];
  notes?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Fine-tuning Dataset
// ---------------------------------------------------------------------------

/** A curated prompt/completion pair for fine-tuning */
export interface FineTuneExample {
  id: string;
  /** Original conversation this was derived from */
  conversationId?: string;
  /** System prompt used */
  systemPrompt: string;
  /** User turn */
  userMessage: string;
  /** Ideal assistant turn */
  assistantMessage: string;
  /** Module/domain tag */
  module?: ModuleName;
  /** Admin rating score if reviewed */
  qualityScore?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Neighborhood Score
// ---------------------------------------------------------------------------

/** Aggregated walkability / livability score for a location */
export interface NeighborhoodScore {
  location: Coordinates;
  /** Overall score 0 – 100 */
  overall: number;
  /** Category breakdown */
  categories: {
    education: number;
    healthcare: number;
    shopping: number;
    transport: number;
    greenery: number;
    safety: number;
  };
  /** Number of POIs found per category within the search radius */
  poiCounts: Partial<Record<POICategory, number>>;
  /** Radius in metres used for the calculation */
  radiusMeters: number;
  computedAt: string;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/** Standard paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Standard API envelope */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Auth (minimal — enough for shared contract)
// ---------------------------------------------------------------------------

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  /** Preferred UI language */
  locale: string;
  createdAt: string;
  updatedAt: string;
}
