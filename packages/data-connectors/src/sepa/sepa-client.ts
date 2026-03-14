import type { Coordinates, AQICategory } from '@uvidai/shared';
import type {
  AirQualityStation,
  AirQualityReading,
  AirQualityStats,
  SepaClient,
} from './index.js';
import { haversineMeters } from '../utils/distance.js';

// ---------------------------------------------------------------------------
// API types (opendata.kosava.cloud)
// ---------------------------------------------------------------------------

interface KosavaStation {
  id: number;
  k_eoi_code: string;
  k_network_id: number;
  k_name: string;
  k_latitude_d: number;
  k_longitude_d: number;
  aq_stationclassification?: string;
}

interface KosavaMeasurement {
  k_date: string;
  k_time: string;
  k_station_id: number;
  k_station_code: string;
  k_component_id: number;
  k_aop_value: number | null;
}

// Component IDs from opendata.kosava.cloud
const COMPONENT = {
  PM10: 5,
  PM25: 6001,
  NO2: 8,
  SO2: 1,
  O3: 7,
  CO: 10,
} as const;

// ---------------------------------------------------------------------------
// Static fallback stations (Belgrade + Novi Sad)
// ---------------------------------------------------------------------------

const FALLBACK_STATIONS: ReadonlyArray<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
}> = [
  { id: 'novi-beograd', name: 'Novi Beograd', lat: 44.8125, lng: 20.4204, city: 'Belgrade' },
  { id: 'stari-grad', name: 'Stari Grad', lat: 44.8184, lng: 20.4586, city: 'Belgrade' },
  { id: 'vracar', name: 'Vracar', lat: 44.7964, lng: 20.4694, city: 'Belgrade' },
  { id: 'zeleno-brdo', name: 'Zeleno Brdo', lat: 44.775, lng: 20.5167, city: 'Belgrade' },
  { id: 'mostar', name: 'Mostar', lat: 44.7883, lng: 20.4583, city: 'Belgrade' },
  { id: 'ns-liman', name: 'Novi Sad - Liman', lat: 45.246, lng: 19.8418, city: 'Novi Sad' },
  { id: 'ns-detelinara', name: 'Novi Sad - Detelinara', lat: 45.266, lng: 19.834, city: 'Novi Sad' },
];

// ---------------------------------------------------------------------------
// AQI category mapping (0-50 excellent, 51-100 good, 101-150 acceptable, 151-200 polluted, 201+ very_polluted)
// ---------------------------------------------------------------------------

function aqiToCategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'excellent';
  if (aqi <= 100) return 'good';
  if (aqi <= 150) return 'acceptable';
  if (aqi <= 200) return 'polluted';
  return 'very_polluted';
}

/**
 * Compute EU-style AQI from PM2.5 µg/m³ (primary) or PM10 µg/m³ (fallback).
 * Returns 0–500 scale.
 */
function pollutantToAqi(pm25?: number, pm10?: number): number {
  const p = pm25 ?? pm10 ?? 0;
  if (p <= 10) return Math.round((p / 10) * 25);
  if (p <= 20) return Math.round(25 + ((p - 10) / 10) * 25);
  if (p <= 25) return Math.round(50 + ((p - 20) / 5) * 25);
  if (p <= 50) return Math.round(75 + ((p - 25) / 25) * 25);
  if (p <= 75) return Math.round(100 + ((p - 50) / 25) * 50);
  if (p <= 100) return Math.round(150 + ((p - 75) / 25) * 50);
  if (p <= 150) return Math.round(200 + ((p - 100) / 50) * 100);
  return Math.min(500, Math.round(300 + ((p - 150) / 100) * 200));
}

// ---------------------------------------------------------------------------
// Fetch with retry (exponential backoff)
// ---------------------------------------------------------------------------

const DEFAULT_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function fetchWithRetry(
  url: string,
  retries = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}: ${url}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < retries) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError ?? new Error('Fetch failed');
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

const KOSAVA_BASE = 'https://opendata.kosava.cloud';
const AMSKV_BASE = 'https://amskv.sepa.gov.rs';

/** Organizations that provide SEPA/xEco air quality data */
const ORG_IDS = [1, 3, 4, 9, 10, 14, 17, 18, 24, 28, 30];

// ---------------------------------------------------------------------------
// SepaHttpClient
// ---------------------------------------------------------------------------

export class SepaHttpClient implements SepaClient {
  private stationsCache: AirQualityStation[] | null = null;
  private readingsCache: Map<string, AirQualityReading> = new Map();
  private cacheTimestamp = 0;
  private readonly cacheTtlMs = 60_000; // 1 minute

  private async fetchStationsFromApi(): Promise<AirQualityStation[]> {
    const allStations: AirQualityStation[] = [];
    const seenIds = new Set<string>();

    // Try amskv.sepa.gov.rs first (may 403)
    try {
      const amskvRes = await fetchWithRetry(`${AMSKV_BASE}/api/stations`, 1);
      if (amskvRes.ok) {
        const data = (await amskvRes.json()) as Array<{
          id?: string | number;
          name?: string;
          latitude?: number;
          longitude?: number;
          lat?: number;
          lng?: number;
        }>;
        if (Array.isArray(data) && data.length > 0) {
          for (const s of data) {
            const id = String(s.id ?? '');
            const lat = s.latitude ?? s.lat ?? 0;
            const lng = s.longitude ?? s.lng ?? 0;
            if (id && (lat || lng)) {
              seenIds.add(id);
              allStations.push({
                id,
                name: s.name ?? id,
                coordinates: { lat, lng },
                active: true,
              });
            }
          }
          if (allStations.length > 0) return allStations;
        }
      }
    } catch {
      // Fall through to opendata.kosava.cloud
    }

    for (const orgId of ORG_IDS) {
      try {
        const res = await fetchWithRetry(`${KOSAVA_BASE}/${orgId}/stations`);
        const data = (await res.json()) as KosavaStation[];
        for (const s of data) {
          const id = String(s.id);
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          allStations.push({
            id,
            name: s.k_name,
            coordinates: { lat: s.k_latitude_d, lng: s.k_longitude_d },
            city: s.k_name.split(' ')[0] === 'Beograd' ? 'Belgrade' : undefined,
            active: true,
          });
        }
      } catch {
        // Skip failed org
      }
    }

    return allStations.length > 0 ? allStations : [];
  }

  private async fetchMeasurementsFromApi(): Promise<Map<string, AirQualityReading>> {
    const byStation = new Map<number, Map<number, number>>();
    let date = '';
    let time = '';

    for (const orgId of ORG_IDS) {
      try {
        const res = await fetchWithRetry(`${KOSAVA_BASE}/${orgId}/measurements/last_hour`);
        const data = (await res.json()) as KosavaMeasurement[];
        for (const m of data) {
          if (m.k_aop_value == null) continue;
          date = m.k_date;
          time = m.k_time;
          if (!byStation.has(m.k_station_id)) {
            byStation.set(m.k_station_id, new Map());
          }
          byStation.get(m.k_station_id)!.set(m.k_component_id, m.k_aop_value);
        }
      } catch {
        // Skip failed org
      }
    }

    const result = new Map<string, AirQualityReading>();
    const measuredAt = date && time ? `${date}T${time}` : new Date().toISOString();

    for (const [stationId, components] of byStation) {
      const pm25 = components.get(COMPONENT.PM25);
      const pm10 = components.get(COMPONENT.PM10);
      const aqi = pollutantToAqi(pm25, pm10);
      result.set(String(stationId), {
        stationId: String(stationId),
        measuredAt,
        aqi,
        category: aqiToCategory(aqi),
        pm25: pm25,
        pm10: pm10,
        no2: components.get(COMPONENT.NO2),
        so2: components.get(COMPONENT.SO2),
        o3: components.get(COMPONENT.O3),
        co: components.get(COMPONENT.CO),
      });
    }

    return result;
  }

  private async ensureStations(): Promise<AirQualityStation[]> {
    const now = Date.now();
    if (this.stationsCache && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.stationsCache;
    }

    try {
      const apiStations = await this.fetchStationsFromApi();
      if (apiStations.length > 0) {
        this.stationsCache = apiStations;
        this.cacheTimestamp = now;
        return apiStations;
      }
    } catch {
      // Fall through to fallback
    }

    this.stationsCache = FALLBACK_STATIONS.map((s) => ({
      id: s.id,
      name: s.name,
      coordinates: { lat: s.lat, lng: s.lng },
      city: s.city,
      active: true,
    }));
    this.cacheTimestamp = now;
    return this.stationsCache;
  }

  private async ensureReadings(): Promise<Map<string, AirQualityReading>> {
    const now = Date.now();
    if (this.readingsCache.size > 0 && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.readingsCache;
    }

    try {
      const apiReadings = await this.fetchMeasurementsFromApi();
      if (apiReadings.size > 0) {
        this.readingsCache = apiReadings;
        this.cacheTimestamp = now;
        return apiReadings;
      }
    } catch {
      // Fall through
    }

    const fallbackReading: AirQualityReading = {
      stationId: '',
      measuredAt: new Date().toISOString(),
      aqi: 50,
      category: 'excellent',
    };

    const fallbackMap = new Map<string, AirQualityReading>();
    for (const s of FALLBACK_STATIONS) {
      fallbackMap.set(s.id, { ...fallbackReading, stationId: s.id });
    }
    this.readingsCache = fallbackMap;
    this.cacheTimestamp = now;
    return fallbackMap;
  }

  async getStations(): Promise<AirQualityStation[]> {
    return this.ensureStations();
  }

  async getLatestReading(stationId: string): Promise<AirQualityReading | null> {
    const [stations, readings] = await Promise.all([
      this.ensureStations(),
      this.ensureReadings(),
    ]);

    const reading = readings.get(stationId);
    if (reading) return reading;

    const station = stations.find((s) => s.id === stationId);
    if (!station) return null;

    return readings.get(station.id) ?? null;
  }

  async getNearestReading(
    center: Coordinates,
    maxDistanceMeters?: number
  ): Promise<{
    station: AirQualityStation;
    reading: AirQualityReading;
    distanceMeters: number;
  } | null> {
    const [stations, readings] = await Promise.all([
      this.ensureStations(),
      this.ensureReadings(),
    ]);

    let nearest: { station: AirQualityStation; distanceMeters: number } | null = null;

    for (const s of stations) {
      const d = haversineMeters(center, s.coordinates);
      if (maxDistanceMeters != null && d > maxDistanceMeters) continue;
      if (!nearest || d < nearest.distanceMeters) {
        nearest = { station: s, distanceMeters: d };
      }
    }

    if (!nearest) return null;

    const reading = readings.get(nearest.station.id);
    if (!reading) return null;

    return {
      station: nearest.station,
      reading,
      distanceMeters: nearest.distanceMeters,
    };
  }

  async getStats(stationId: string, from: string, to: string): Promise<AirQualityStats> {
    const reading = await this.getLatestReading(stationId);
    const aqi = reading?.aqi ?? 50;

    return {
      stationId,
      from,
      to,
      avgAqi: aqi,
      maxAqi: aqi,
      minAqi: aqi,
      readings: reading ? 1 : 0,
    };
  }
}
