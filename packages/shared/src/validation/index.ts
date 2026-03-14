import { z } from 'zod';
import { SUPPORTED_LOCALES, RADIUS, PAGINATION, RATING_SCALE } from '../constants/index.js';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export const locationSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  coordinates: coordinatesSchema,
  municipality: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2).default('RS'),
});

// ---------------------------------------------------------------------------
// POI
// ---------------------------------------------------------------------------

export const poiCategorySchema = z.enum([
  'school', 'kindergarten', 'hospital', 'doctors', 'pharmacy',
  'bank', 'post_office', 'supermarket', 'park', 'restaurant',
  'cafe', 'bus_station', 'tram_stop', 'parking', 'fuel',
  'gym', 'library', 'place_of_worship',
]);

export const poiSchema = z.object({
  id: z.string().min(1),
  osmId: z.string().optional(),
  name: z.string(),
  category: poiCategorySchema,
  coordinates: coordinatesSchema,
  distanceMeters: z.number().nonnegative().optional(),
  tags: z.record(z.string()).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  openingHours: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Air Quality
// ---------------------------------------------------------------------------

export const aqiCategorySchema = z.enum([
  'excellent', 'good', 'acceptable', 'polluted', 'very_polluted',
]);

export const airQualitySchema = z.object({
  stationId: z.string().min(1),
  stationName: z.string(),
  coordinates: coordinatesSchema,
  aqi: z.number().nonnegative(),
  category: aqiCategorySchema,
  measuredAt: z.string().datetime(),
  pm25: z.number().nonnegative().optional(),
  pm10: z.number().nonnegative().optional(),
  no2: z.number().nonnegative().optional(),
  so2: z.number().nonnegative().optional(),
  o3: z.number().nonnegative().optional(),
  co: z.number().nonnegative().optional(),
  distanceMeters: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export const companyLegalFormSchema = z.enum([
  'doo', 'ad', 'preduzetnik', 'zd', 'kd', 'od', 'other',
]);

export const companyStatusSchema = z.enum([
  'active', 'in_bankruptcy', 'in_liquidation', 'deleted', 'blocked',
]);

export const companySchema = z.object({
  registrationNumber: z.string().min(1),
  taxId: z.string().min(1),
  name: z.string().min(1),
  legalForm: companyLegalFormSchema,
  status: companyStatusSchema,
  address: z.string().optional(),
  foundedAt: z.string().optional(),
  activityCode: z.string().optional(),
  activityDescription: z.string().optional(),
  isBlocked: z.boolean(),
  blockedDaysLastYear: z.number().nonnegative().optional(),
  representative: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Parcel
// ---------------------------------------------------------------------------

export const parcelSchema = z.object({
  parcelNumber: z.string().min(1),
  cadastralMunicipality: z.string().min(1),
  area: z.number().positive().optional(),
  landUse: z.string().optional(),
  encumbrances: z.array(z.string()).optional(),
  owners: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Messages & Conversations
// ---------------------------------------------------------------------------

export const moduleNameSchema = z.enum([
  'legal_check', 'environment', 'lifestyle', 'price_radar',
  'neighborhood_score', 'transport', 'business_scanner', 'general',
]);

export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const messageAttachmentSchema = z.object({
  type: z.enum(['poi_list', 'air_quality', 'company_info', 'parcel_info', 'map_marker', 'chart']),
  data: z.unknown(),
  label: z.string().optional(),
});

export const tokenUsageSchema = z.object({
  promptTokens: z.number().nonnegative(),
  completionTokens: z.number().nonnegative(),
  totalTokens: z.number().nonnegative(),
});

export const messageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  role: messageRoleSchema,
  content: z.string(),
  attachments: z.array(messageAttachmentSchema).optional(),
  module: moduleNameSchema.optional(),
  createdAt: z.string().datetime(),
  tokenUsage: tokenUsageSchema.optional(),
});

export const conversationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().optional(),
  location: locationSchema.optional(),
  messages: z.array(messageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Feedback & Ratings
// ---------------------------------------------------------------------------

export const feedbackSentimentSchema = z.enum(['positive', 'negative', 'neutral']);

export const feedbackSchema = z.object({
  id: z.string().min(1),
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  userId: z.string().min(1),
  sentiment: feedbackSentimentSchema,
  comment: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const adminRatingSchema = z.object({
  id: z.string().min(1),
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  ratedBy: z.string().min(1),
  score: z.number().int().min(RATING_SCALE.MIN).max(RATING_SCALE.MAX),
  correctedResponse: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Fine-tune
// ---------------------------------------------------------------------------

export const fineTuneExampleSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().optional(),
  systemPrompt: z.string().min(1),
  userMessage: z.string().min(1),
  assistantMessage: z.string().min(1),
  module: moduleNameSchema.optional(),
  qualityScore: z.number().int().min(RATING_SCALE.MIN).max(RATING_SCALE.MAX).optional(),
  createdAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Neighborhood Score
// ---------------------------------------------------------------------------

export const neighborhoodScoreSchema = z.object({
  location: coordinatesSchema,
  overall: z.number().min(0).max(100),
  categories: z.object({
    education: z.number().min(0).max(100),
    healthcare: z.number().min(0).max(100),
    shopping: z.number().min(0).max(100),
    transport: z.number().min(0).max(100),
    greenery: z.number().min(0).max(100),
    safety: z.number().min(0).max(100),
  }),
  poiCounts: z.record(poiCategorySchema, z.number().nonnegative()).optional(),
  radiusMeters: z.number().positive(),
  computedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Request helpers (API input validation)
// ---------------------------------------------------------------------------

export const locationQuerySchema = z.object({
  address: z.string().min(1).optional(),
  coordinates: coordinatesSchema.optional(),
  radiusMeters: z.number().positive().max(RADIUS.MAX).default(RADIUS.DEFAULT),
}).refine(
  (d) => d.address || d.coordinates,
  { message: 'Provide either address or coordinates' },
);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce.number().int().positive().max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export const chatInputSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2_000),
  location: locationSchema.optional(),
  locale: z.enum(SUPPORTED_LOCALES).default('sr-Latn'),
});

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const userRoleSchema = z.enum(['user', 'admin', 'superadmin']);

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  role: userRoleSchema,
  locale: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
