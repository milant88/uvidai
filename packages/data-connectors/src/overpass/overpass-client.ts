import type { Coordinates, POICategory } from '@uvidai/shared';
import type {
  OverpassElement,
  OverpassClient,
  POIQuery,
  POIResult,
} from './index.js';

/** Maps POICategory to one or more OSM tag conditions for OverpassQL */
const CATEGORY_TO_OSM: Record<
  POICategory,
  ReadonlyArray<{ key: string; value: string }>
> = {
  school: [{ key: 'amenity', value: 'school' }],
  kindergarten: [{ key: 'amenity', value: 'kindergarten' }],
  hospital: [{ key: 'amenity', value: 'hospital' }],
  doctors: [{ key: 'amenity', value: 'doctors' }],
  pharmacy: [{ key: 'amenity', value: 'pharmacy' }],
  bank: [{ key: 'amenity', value: 'bank' }],
  post_office: [{ key: 'amenity', value: 'post_office' }],
  supermarket: [{ key: 'shop', value: 'supermarket' }],
  park: [{ key: 'leisure', value: 'park' }],
  restaurant: [{ key: 'amenity', value: 'restaurant' }],
  cafe: [{ key: 'amenity', value: 'cafe' }],
  bus_station: [
    { key: 'highway', value: 'bus_stop' },
    { key: 'public_transport', value: 'platform' },
  ],
  tram_stop: [{ key: 'railway', value: 'tram_stop' }],
  parking: [{ key: 'amenity', value: 'parking' }],
  fuel: [{ key: 'amenity', value: 'fuel' }],
  gym: [{ key: 'leisure', value: 'fitness_centre' }],
  library: [{ key: 'amenity', value: 'library' }],
  place_of_worship: [{ key: 'amenity', value: 'place_of_worship' }],
};

/** Haversine distance in metres between two WGS-84 points */
function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lng: number }
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Extract coordinates from an Overpass element (node: lat/lon, way/relation: center) */
function getCoordinates(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
}

/** Build OverpassQL for a single tag condition */
function buildTagFilter(key: string, value: string): string {
  return `["${key}"="${value}"]`;
}

/** Build the main union query for all categories */
function buildOverpassQL(
  center: Coordinates,
  radiusMeters: number,
  categories: POICategory[],
  timeoutSeconds: number
): string {
  const { lat, lng } = center;
  const radius = Math.round(radiusMeters);
  const parts: string[] = [];

  for (const cat of categories) {
    const conditions = CATEGORY_TO_OSM[cat];
    for (const { key, value } of conditions) {
      const filter = buildTagFilter(key, value);
      parts.push(
        `node(around:${radius},${lat},${lng})${filter}`,
        `way(around:${radius},${lat},${lng})${filter}`,
        `relation(around:${radius},${lat},${lng})${filter}`
      );
    }
  }

  if (parts.length === 0) {
    return `[out:json][timeout:${timeoutSeconds}];out center;`;
  }

  const union = parts.join(';\n  ');
  return `[out:json][timeout:${timeoutSeconds}];
(
  ${union}
);
out center;`;
}

/** Order for category inference (more specific before generic, e.g. tram_stop before bus_station) */
const CATEGORY_INFER_ORDER: readonly POICategory[] = [
  'tram_stop',
  'bus_station',
  'school',
  'kindergarten',
  'hospital',
  'doctors',
  'pharmacy',
  'bank',
  'post_office',
  'supermarket',
  'park',
  'restaurant',
  'cafe',
  'parking',
  'fuel',
  'gym',
  'library',
  'place_of_worship',
] as const;

/** Infer POICategory from element tags (reverse lookup) */
function inferCategory(tags: Record<string, string>): POICategory | null {
  for (const cat of CATEGORY_INFER_ORDER) {
    const conditions = CATEGORY_TO_OSM[cat];
    for (const { key, value } of conditions) {
      if (tags[key] === value) {
        return cat;
      }
    }
  }
  return null;
}

/** Raw Overpass API response structure */
interface OverpassResponse {
  elements?: Array<{
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
}

export interface OverpassHttpClientOptions {
  endpoint?: string;
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
}

/**
 * HTTP client for the Overpass API with retry logic and POI mapping.
 */
export class OverpassHttpClient implements OverpassClient {
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;

  constructor(options: OverpassHttpClientOptions = {}) {
    this.endpoint =
      options.endpoint ?? 'https://overpass-api.de/api/interpreter';
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.initialBackoffMs = options.initialBackoffMs ?? 1_000;
  }

  async rawQuery(overpassQL: string): Promise<OverpassElement[]> {
    const elements = await this.fetchWithRetry(overpassQL);
    return elements.map((el) => ({
      type: el.type,
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      center: el.center,
      tags: el.tags ?? {},
    }));
  }

  async queryPOIs(query: POIQuery): Promise<POIResult[]> {
    const { center, radiusMeters, categories, limit } = query;
    const timeoutSeconds = Math.floor(this.timeoutMs / 1000);

    const overpassQL = buildOverpassQL(
      center,
      radiusMeters,
      categories,
      timeoutSeconds
    );

    const elements = await this.fetchWithRetry(overpassQL);
    const results: POIResult[] = [];
    const limitPerCategory = limit ?? 0;
    const counts: Partial<Record<POICategory, number>> = {};

    for (const el of elements) {
      const coords = getCoordinates(el);
      if (!coords) continue;

      const category = el.tags ? inferCategory(el.tags) : null;
      if (!category || !categories.includes(category)) continue;

      const distanceMeters = haversineMeters(coords, center);
      const name =
        el.tags?.name ??
        el.tags?.brand ??
        el.tags?.operator ??
        '';

      if (limitPerCategory > 0) {
        const current = (counts[category] ?? 0) + 1;
        if (current > limitPerCategory) continue;
        counts[category] = current;
      }

      results.push({
        osmId: `${el.type.charAt(0)}${el.id}`,
        name: name || `Unknown (${category})`,
        category,
        coordinates: { lat: coords.lat, lng: coords.lon },
        tags: el.tags ?? {},
        distanceMeters,
      });
    }

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }

  private async fetchWithRetry(
    overpassQL: string
  ): Promise<NonNullable<OverpassResponse['elements']>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.timeoutMs
        );

        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(overpassQL)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 429) {
          const backoffMs =
            this.initialBackoffMs * Math.pow(2, attempt);
          await this.sleep(backoffMs);
          continue;
        }

        if (!res.ok) {
          throw new Error(
            `Overpass API error: ${res.status} ${res.statusText}`
          );
        }

        const data = (await res.json()) as OverpassResponse;
        return data.elements ?? [];
      } catch (err) {
        lastError =
          err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          const backoffMs =
            this.initialBackoffMs * Math.pow(2, attempt);
          await this.sleep(backoffMs);
        }
      }
    }

    throw lastError ?? new Error('Overpass request failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
