import type { Coordinates } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// Geocoder — address ↔ coordinate resolution
// ---------------------------------------------------------------------------

/** Result of a geocoding (address → coordinates) query */
export interface GeocodingResult {
  /** Human-readable display name */
  displayName: string;
  coordinates: Coordinates;
  /** Structured address components */
  address: {
    road?: string;
    houseNumber?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  };
  /** Bounding box [south, north, west, east] */
  boundingBox?: [number, number, number, number];
  /** Confidence score 0 – 1 (provider-dependent) */
  confidence?: number;
  /** OSM place ID */
  osmId?: string;
  osmType?: 'node' | 'way' | 'relation';
}

/** Options for geocoding requests */
export interface GeocodingOptions {
  /** Restrict results to a specific country (ISO 3166-1 alpha-2) */
  countryCodes?: string[];
  /** Preferred language for results (BCP-47) */
  language?: string;
  /** Max results to return */
  limit?: number;
  /** Bias results towards this location */
  proximity?: Coordinates;
}

/**
 * Geocoder interface (Nominatim, Photon, etc.)
 *
 * Provides forward geocoding (address → coords) and
 * reverse geocoding (coords → address).
 */
export interface GeocoderClient {
  /** Forward geocode: address string → locations */
  geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;

  /** Reverse geocode: coordinates → address */
  reverse(coordinates: Coordinates, options?: GeocodingOptions): Promise<GeocodingResult | null>;
}

export { NominatimClient } from './nominatim-client.js';
