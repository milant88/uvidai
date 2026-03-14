import { Injectable, Logger } from '@nestjs/common';
import { OverpassHttpClient } from '@uvidai/data-connectors';
import type { POIResult } from '@uvidai/data-connectors';
import { haversineMeters } from '@uvidai/data-connectors';

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);
  private readonly overpass = new OverpassHttpClient();

  async getStops(
    lat: number,
    lng: number,
    radiusMeters = 1000
  ): Promise<POIResult[]> {
    try {
      this.logger.debug(`Transport stops at ${lat},${lng} r=${radiusMeters}m`);
      const results = await this.overpass.queryPOIs({
        center: { lat, lng },
        radiusMeters,
        categories: ['bus_station', 'tram_stop'],
      });
      return results;
    } catch (err) {
      this.logger.error(`Transport stops failed: ${err}`);
      throw err;
    }
  }

  async getCommuteEstimate(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<{
    walkingMinutes: number;
    busMinutes: number;
    carMinutes: number;
    nearestStops: POIResult[];
  }> {
    try {
      const from = { lat: fromLat, lng: fromLng };
      const to = { lat: toLat, lng: toLng };
      const distanceMeters = haversineMeters(from, to);
      const distanceKm = distanceMeters / 1000;

      // Walking: ~5 km/h → minutes = distance_km / 5 * 60
      const walkingMinutes = Math.round((distanceKm / 5) * 60);
      // Bus: ~20 km/h average + 10 min wait
      const busMinutes = Math.round((distanceKm / 20) * 60 + 10);
      // Car: ~30 km/h (Belgrade traffic factor)
      const carMinutes = Math.round((distanceKm / 30) * 60);

      const nearestStops = await this.overpass.queryPOIs({
        center: from,
        radiusMeters: 1000,
        categories: ['bus_station', 'tram_stop'],
        limit: 5,
      });

      return {
        walkingMinutes,
        busMinutes,
        carMinutes,
        nearestStops,
      };
    } catch (err) {
      this.logger.error(`Commute estimate failed: ${err}`);
      throw err;
    }
  }
}
