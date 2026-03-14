import type { Coordinates, POICategory } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// Overpass API — OpenStreetMap POI queries
// ---------------------------------------------------------------------------

/** Query parameters for an Overpass POI search */
export interface POIQuery {
  /** Centre point of the search */
  center: Coordinates;
  /** Search radius in metres */
  radiusMeters: number;
  /** Amenity categories to include */
  categories: POICategory[];
  /** Max results per category (0 = unlimited) */
  limit?: number;
}

/** Raw Overpass element before mapping to domain POI */
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Mapped result from an Overpass query */
export interface POIResult {
  osmId: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates;
  tags: Record<string, string>;
  /** Distance from query centre in metres (computed client-side) */
  distanceMeters: number;
}

/**
 * Client interface for the Overpass API.
 *
 * Implementations handle OverpassQL query building, rate limiting,
 * and response parsing.
 */
export interface OverpassClient {
  /** Search for POIs around a point */
  queryPOIs(query: POIQuery): Promise<POIResult[]>;

  /** Execute a raw OverpassQL query string */
  rawQuery(overpassQL: string): Promise<OverpassElement[]>;
}

export { OverpassHttpClient } from './overpass-client.js';
