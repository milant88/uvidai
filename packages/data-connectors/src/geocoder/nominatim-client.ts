import type { Coordinates } from '@uvidai/shared';
import type { GeocodingOptions, GeocodingResult, GeocoderClient } from './index.js';

const DEFAULT_ENDPOINT = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'UvidAI/0.1.0 (uvidai.rs)';
const MIN_REQUEST_INTERVAL_MS = 1000;
const DEFAULT_LIMIT = 5;
const DEFAULT_COUNTRY = 'rs';
const DEFAULT_LANGUAGE = 'sr';

/** Raw Nominatim search/reverse response item */
interface NominatimPlace {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string];
  importance?: number;
  osm_id?: number;
  osm_type?: string;
}

function mapNominatimToResult(place: NominatimPlace): GeocodingResult {
  const lat = place.lat ? parseFloat(place.lat) : 0;
  const lon = place.lon ? parseFloat(place.lon) : 0;
  const addr = place.address ?? {};

  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? undefined;

  const boundingBox: [number, number, number, number] | undefined =
    place.boundingbox && place.boundingbox.length >= 4
      ? [
          parseFloat(place.boundingbox[0]),
          parseFloat(place.boundingbox[1]),
          parseFloat(place.boundingbox[2]),
          parseFloat(place.boundingbox[3]),
        ]
      : undefined;

  const osmType = place.osm_type as 'node' | 'way' | 'relation' | undefined;
  const validOsmType =
    osmType === 'node' || osmType === 'way' || osmType === 'relation'
      ? osmType
      : undefined;

  return {
    displayName: place.display_name ?? '',
    coordinates: { lat, lng: lon },
    address: {
      road: addr.road,
      houseNumber: addr.house_number,
      suburb: addr.suburb,
      city,
      municipality: addr.municipality,
      county: addr.county,
      state: addr.state,
      postalCode: addr.postcode,
      country: addr.country,
      countryCode: addr.country_code,
    },
    boundingBox,
    confidence: place.importance,
    osmId: place.osm_id?.toString(),
    osmType: validOsmType,
  };
}

/**
 * Nominatim geocoder client with request throttling (max 1 req/sec per
 * Nominatim usage policy).
 */
export class NominatimClient implements GeocoderClient {
  private readonly endpoint: string;
  private lastRequestTime = 0;

  constructor(endpoint = DEFAULT_ENDPOINT) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((r) =>
        setTimeout(r, MIN_REQUEST_INTERVAL_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithThrottle(
    url: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<Response> {
    await this.throttle();
    return fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Accept-Language': language,
      },
    });
  }

  async geocode(
    query: string,
    options?: GeocodingOptions
  ): Promise<GeocodingResult[]> {
    try {
      const limit = options?.limit ?? DEFAULT_LIMIT;
      const countryCodes = options?.countryCodes ?? [DEFAULT_COUNTRY];
      const language = options?.language ?? DEFAULT_LANGUAGE;

      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: String(Math.min(limit, 40)),
        countrycodes: countryCodes.map((c) => c.toLowerCase()).join(','),
      });

      if (options?.proximity) {
        const { lat, lng } = options.proximity;
        const delta = 0.01;
        params.set(
          'viewbox',
          `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
        );
      }

      const url = `${this.endpoint}/search?${params.toString()}`;
      const res = await this.fetchWithThrottle(url, language);

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as NominatimPlace[];
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(mapNominatimToResult);
    } catch {
      return [];
    }
  }

  async reverse(
    coordinates: Coordinates,
    options?: GeocodingOptions
  ): Promise<GeocodingResult | null> {
    try {
      const language = options?.language ?? DEFAULT_LANGUAGE;

      const params = new URLSearchParams({
        lat: String(coordinates.lat),
        lon: String(coordinates.lng),
        format: 'jsonv2',
        addressdetails: '1',
      });

      const url = `${this.endpoint}/reverse?${params.toString()}`;
      const res = await this.fetchWithThrottle(url, language);

      if (!res.ok) {
        return null;
      }

      const data = (await res.json()) as NominatimPlace | { error?: string };
      if (!data || typeof data !== 'object' || 'error' in data) {
        return null;
      }

      return mapNominatimToResult(data as NominatimPlace);
    } catch {
      return null;
    }
  }
}
