import type { POICategory, ModuleName } from '../types/index.js';

/** Supported UI languages (BCP-47 tags) */
export const SUPPORTED_LOCALES = ['sr-Latn', 'sr-Cyrl', 'en', 'ru'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'sr-Latn';

/** Default country for all location queries */
export const DEFAULT_COUNTRY = 'RS';

/** Search radius presets in metres */
export const RADIUS = {
  /** Walkable micro-radius (nearby POIs) */
  NEARBY: 500,
  /** Default search radius */
  DEFAULT: 1_000,
  /** Extended radius for less-common amenities */
  EXTENDED: 2_000,
  /** Max allowed radius */
  MAX: 5_000,
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/** Module metadata — ordered by display priority */
export const MODULES: ReadonlyArray<{ name: ModuleName; icon: string; color: string }> = [
  { name: 'legal_check', icon: 'scale', color: '#3B82F6' },
  { name: 'environment', icon: 'leaf', color: '#10B981' },
  { name: 'lifestyle', icon: 'coffee', color: '#F59E0B' },
  { name: 'price_radar', icon: 'trending-up', color: '#EF4444' },
  { name: 'neighborhood_score', icon: 'map-pin', color: '#8B5CF6' },
  { name: 'transport', icon: 'bus', color: '#06B6D4' },
  { name: 'business_scanner', icon: 'briefcase', color: '#F97316' },
  { name: 'general', icon: 'message-circle', color: '#6B7280' },
] as const;

/** POI categories grouped by domain for the lifestyle module */
export const POI_GROUPS: Record<string, readonly POICategory[]> = {
  education: ['school', 'kindergarten', 'library'],
  healthcare: ['hospital', 'doctors', 'pharmacy'],
  shopping: ['supermarket', 'bank', 'post_office'],
  transport: ['bus_station', 'tram_stop', 'parking', 'fuel'],
  leisure: ['park', 'restaurant', 'cafe', 'gym'],
  other: ['place_of_worship'],
} as const;

/** AQI breakpoints aligned with Serbian SEPA scale */
export const AQI_BREAKPOINTS = {
  EXCELLENT_MAX: 50,
  GOOD_MAX: 100,
  ACCEPTABLE_MAX: 150,
  POLLUTED_MAX: 200,
} as const;

/** Token limits for different LLM contexts */
export const TOKEN_LIMITS = {
  /** Max tokens in a single user message */
  USER_MESSAGE: 2_000,
  /** Max total context window budget */
  CONTEXT_WINDOW: 128_000,
  /** Max tokens for assistant response */
  MAX_COMPLETION: 4_096,
} as const;

/** Admin rating scale bounds */
export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
} as const;
