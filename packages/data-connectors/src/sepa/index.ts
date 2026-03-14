import type { Coordinates, AQICategory } from '@uvidai/shared';

// ---------------------------------------------------------------------------
// SEPA — Serbian Environmental Protection Agency air quality data
// ---------------------------------------------------------------------------

/** A SEPA monitoring station */
export interface AirQualityStation {
  id: string;
  name: string;
  coordinates: Coordinates;
  /** City / settlement the station belongs to */
  city?: string;
  /** Whether the station is currently active */
  active: boolean;
}

/** A single pollutant reading from a station */
export interface AirQualityReading {
  stationId: string;
  /** ISO-8601 timestamp */
  measuredAt: string;
  /** Overall AQI */
  aqi: number;
  category: AQICategory;
  pm25?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
}

/** Aggregated daily/hourly statistics for a station */
export interface AirQualityStats {
  stationId: string;
  /** Period start (ISO-8601) */
  from: string;
  /** Period end (ISO-8601) */
  to: string;
  avgAqi: number;
  maxAqi: number;
  minAqi: number;
  readings: number;
}

/**
 * Client interface for SEPA air quality data.
 *
 * Implementations scrape or call the SEPA public endpoints.
 */
export interface SepaClient {
  /** List all monitoring stations */
  getStations(): Promise<AirQualityStation[]>;

  /** Get the latest reading from a specific station */
  getLatestReading(stationId: string): Promise<AirQualityReading | null>;

  /** Get the nearest station and its latest reading */
  getNearestReading(center: Coordinates, maxDistanceMeters?: number): Promise<{
    station: AirQualityStation;
    reading: AirQualityReading;
    distanceMeters: number;
  } | null>;

  /** Get historical stats for a station over a date range */
  getStats(stationId: string, from: string, to: string): Promise<AirQualityStats>;
}

export { SepaHttpClient } from './sepa-client.js';
