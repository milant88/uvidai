import type { Coordinates } from '@uvidai/shared';
import type {
  GeoSrbijaClient,
  ParcelInfo,
  ParcelQueryOptions,
  CadastralData,
  GeoJsonGeometry,
} from './index.js';
import { NominatimClient } from '../geocoder/nominatim-client.js';

const WFS_BASE = 'https://a3.geosrbija.rs';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_RETRIES = 2;
const BASE_DELAY_MS = 500;
const USER_AGENT = 'UvidAI/0.1.0 (uvidai.rs; cadastral)';

// Common WFS layer names for cadastral parcels (RGZ/GeoSrbija)
const PARCEL_LAYER_NAMES = [
  'registar_nepokretnosti:parcela',
  'parcela',
  'parcels',
  'katastarska_parcela',
];

// ---------------------------------------------------------------------------
// GeoJSON / WFS response types
// ---------------------------------------------------------------------------

interface GeoJsonFeature {
  type: 'Feature';
  id?: string;
  geometry?: {
    type: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features?: GeoJsonFeature[];
}

// ---------------------------------------------------------------------------
// Fetch with retry
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  retries = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
    }
  }
  throw lastError ?? new Error('Fetch failed');
}

function extractCentroid(geom: GeoJsonFeature['geometry']): Coordinates | undefined {
  if (!geom?.coordinates) return undefined;
  const coords = geom.coordinates as unknown;
  if (Array.isArray(coords) && coords.length >= 2) {
    const first = coords[0];
    if (typeof first === 'number' && typeof coords[1] === 'number') {
      return { lat: coords[1], lng: coords[0] };
    }
    if (Array.isArray(first) && first.length >= 2) {
      const pt = first[0];
      if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
        return { lat: pt[1], lng: pt[0] };
      }
      if (typeof pt === 'number' && typeof first[1] === 'number') {
        return { lat: first[1], lng: first[0] };
      }
    }
  }
  return undefined;
}

function mapFeatureToParcelInfo(
  f: GeoJsonFeature,
  layerName: string
): ParcelInfo {
  const p = f.properties ?? {};
  const parcelNumber = String(p.broj_parcele ?? p.parcelNumber ?? p.broj ?? p.id ?? '');
  const cadastralMunicipality = String(
    p.katastarska_opstina ?? p.cadastralMunicipality ?? p.opstina ?? ''
  );
  const area = typeof p.povrsina === 'number' ? p.povrsina : undefined;
  const landUse = p.nacin_koriscenja
    ? String(p.nacin_koriscenja)
    : p.landUse
      ? String(p.landUse)
      : undefined;
  const encumbrances: string[] = [];
  if (Array.isArray(p.zabelezbe)) {
    encumbrances.push(...p.zabelezbe.map(String));
  } else if (p.encumbrances && Array.isArray(p.encumbrances)) {
    encumbrances.push(...p.encumbrances.map(String));
  }
  const owners: string[] = [];
  if (Array.isArray(p.vlasnici)) {
    owners.push(...p.vlasnici.map(String));
  } else if (p.owners && Array.isArray(p.owners)) {
    owners.push(...p.owners.map(String));
  }

  const geometry: GeoJsonGeometry | undefined = f.geometry
    ? {
        type: (f.geometry.type as 'Polygon' | 'MultiPolygon' | 'Point') ?? 'Polygon',
        coordinates: f.geometry.coordinates ?? [],
      }
    : undefined;

  return {
    parcelNumber: (parcelNumber || f.id?.toString()) ?? '',
    cadastralMunicipality,
    area,
    landUse,
    encumbrances: encumbrances.length > 0 ? encumbrances : undefined,
    owners: owners.length > 0 ? owners : undefined,
    geometry,
    centroid: extractCentroid(f.geometry),
  };
}

// ---------------------------------------------------------------------------
// GeoSrbijaHttpClient
// ---------------------------------------------------------------------------

export class GeoSrbijaHttpClient implements GeoSrbijaClient {
  private readonly nominatim = new NominatimClient();
  private readonly parcelCache = new Map<string, { data: ParcelInfo; ts: number }>();
  private readonly cadastralCache = new Map<string, { data: CadastralData; ts: number }>();

  private getCacheKey(options: ParcelQueryOptions): string {
    if (options.coordinates) {
      return `coord:${options.coordinates.lat}:${options.coordinates.lng}`;
    }
    if (options.parcelNumber && options.cadastralMunicipality) {
      return `parcel:${options.parcelNumber}:${options.cadastralMunicipality}`;
    }
    if (options.address) {
      return `addr:${options.address}`;
    }
    return '';
  }

  private getCached<K>(
    cache: Map<string, { data: K; ts: number }>,
    key: string
  ): K | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<K>(
    cache: Map<string, { data: K; ts: number }>,
    key: string,
    data: K
  ): void {
    cache.set(key, { data, ts: Date.now() });
  }

  private async tryWfsGetFeature(
    typeName: string,
    cqlFilter: string
  ): Promise<GeoJsonFeature[]> {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName,
      outputFormat: 'application/json',
      count: '10',
      CQL_FILTER: cqlFilter,
    });

    const basePaths = ['/wfs/registar_nepokretnosti', '/wfs', ''];
    for (const path of basePaths) {
      const base = path ? `${WFS_BASE}${path}` : WFS_BASE;
      const url = `${base}?${params.toString()}`;
      try {
        const res = await fetchWithRetry(url);
        if (!res.ok) continue;
        const data = (await res.json()) as GeoJsonFeatureCollection;
        const features = data?.features ?? [];
        if (features.length > 0) return features;
      } catch {
        continue;
      }
    }
    return [];
  }

  private async findParcelByCoordinates(
    coords: Coordinates
  ): Promise<ParcelInfo | null> {
    const cql = `INTERSECTS(the_geom, POINT(${coords.lng} ${coords.lat}))`;
    for (const layerName of PARCEL_LAYER_NAMES) {
      const features = await this.tryWfsGetFeature(layerName, cql);
      if (features.length > 0) {
        return mapFeatureToParcelInfo(features[0], layerName);
      }
    }
    return null;
  }

  private async findParcelByNumber(
    parcelNumber: string,
    cadastralMunicipality: string
  ): Promise<ParcelInfo | null> {
    const escapedNum = parcelNumber.replace(/'/g, "''");
    const escapedOpstina = cadastralMunicipality.replace(/'/g, "''");
    const cql = `broj_parcele='${escapedNum}' AND katastarska_opstina='${escapedOpstina}'`;
    for (const layerName of PARCEL_LAYER_NAMES) {
      const features = await this.tryWfsGetFeature(layerName, cql);
      if (features.length > 0) {
        return mapFeatureToParcelInfo(features[0], layerName);
      }
    }
    return null;
  }

  async findParcel(options: ParcelQueryOptions): Promise<ParcelInfo | null> {
    if (options.coordinates) {
      const key = this.getCacheKey(options);
      const cached = this.getCached(this.parcelCache, key);
      if (cached) return cached;

      const result = await this.findParcelByCoordinates(options.coordinates);
      if (result) this.setCache(this.parcelCache, key, result);
      return result;
    }

    if (options.parcelNumber && options.cadastralMunicipality) {
      const key = this.getCacheKey(options);
      const cached = this.getCached(this.parcelCache, key);
      if (cached) return cached;

      const result = await this.findParcelByNumber(
        options.parcelNumber,
        options.cadastralMunicipality
      );
      if (result) this.setCache(this.parcelCache, key, result);
      return result;
    }

    if (options.address) {
      const key = this.getCacheKey(options);
      const cached = this.getCached(this.parcelCache, key);
      if (cached) return cached;

      const geocodeResults = await this.nominatim.geocode(options.address, {
        countryCodes: ['rs'],
        limit: 1,
      });
      const first = geocodeResults[0];
      if (!first) return null;

      const result = await this.findParcelByCoordinates(first.coordinates);
      if (result) this.setCache(this.parcelCache, key, result);
      return result;
    }

    return null;
  }

  async getCadastralData(options: ParcelQueryOptions): Promise<CadastralData | null> {
    const key = `cadastral:${this.getCacheKey(options)}`;
    const cached = this.getCached(this.cadastralCache, key);
    if (cached) return cached;

    const parcel = await this.findParcel(options);
    if (!parcel) return null;

    const data: CadastralData = { parcel };
    this.setCache(this.cadastralCache, key, data);
    return data;
  }

  async listParcels(
    bbox: { south: number; west: number; north: number; east: number },
    limit = 50
  ): Promise<ParcelInfo[]> {
    const cql = `BBOX(the_geom,${bbox.west},${bbox.south},${bbox.east},${bbox.north})`;
    const results: ParcelInfo[] = [];

    for (const layerName of PARCEL_LAYER_NAMES) {
      try {
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: layerName,
          outputFormat: 'application/json',
          count: String(limit),
          CQL_FILTER: cql,
        });
        const url = `${WFS_BASE}/wfs/registar_nepokretnosti?${params.toString()}`;
        const res = await fetchWithRetry(url);
        if (!res.ok) continue;
        const data = (await res.json()) as GeoJsonFeatureCollection;
        const features = data?.features ?? [];
        for (const f of features.slice(0, limit)) {
          results.push(mapFeatureToParcelInfo(f, layerName));
        }
        if (results.length > 0) break;
      } catch {
        continue;
      }
    }

    return results;
  }

  /**
   * Get parcel at coordinates. Convenience wrapper for findParcel.
   */
  async getParcelByCoordinates(lat: number, lng: number): Promise<ParcelInfo | null> {
    return this.findParcel({ coordinates: { lat, lng } });
  }

  /**
   * Get parcel by number and cadastral municipality.
   */
  async getParcelByNumber(
    parcelNumber: string,
    cadastralMunicipality: string
  ): Promise<ParcelInfo | null> {
    return this.findParcel({ parcelNumber, cadastralMunicipality });
  }

  /**
   * Get encumbrances for a parcel. Returns empty array if parcel not found.
   */
  async getEncumbrances(
    parcelNumber: string,
    cadastralMunicipality: string
  ): Promise<string[]> {
    const parcel = await this.getParcelByNumber(parcelNumber, cadastralMunicipality);
    return parcel?.encumbrances ?? [];
  }
}
