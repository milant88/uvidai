import { Injectable, Logger } from '@nestjs/common';
import { OverpassHttpClient } from '@uvidai/data-connectors';
import type { NeighborhoodScore, POICategory } from '@uvidai/shared';

@Injectable()
export class NeighborhoodService {
  private readonly logger = new Logger(NeighborhoodService.name);
  private readonly overpass = new OverpassHttpClient();

  async getScore(
    lat: number,
    lng: number,
    radiusMeters = 1000
  ): Promise<NeighborhoodScore> {
    try {
      const center = { lat, lng };

      const [
        schools,
        kindergartens,
        hospitals,
        doctors,
        pharmacies,
        supermarkets,
        banks,
        postOffices,
        busStops,
        tramStops,
        parks,
      ] = await Promise.all([
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['school'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['kindergarten'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['hospital'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['doctors'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['pharmacy'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['supermarket'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['bank'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['post_office'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['bus_station'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['tram_stop'],
        }),
        this.overpass.queryPOIs({
          center,
          radiusMeters,
          categories: ['park'],
        }),
      ]);

      const poiCounts: Partial<Record<POICategory, number>> = {
        school: schools.length,
        kindergarten: kindergartens.length,
        hospital: hospitals.length,
        doctors: doctors.length,
        pharmacy: pharmacies.length,
        supermarket: supermarkets.length,
        bank: banks.length,
        post_office: postOffices.length,
        bus_station: busStops.length,
        tram_stop: tramStops.length,
        park: parks.length,
      };

      const schoolCount = schools.length;
      const kindergartenCount = kindergartens.length;
      const hospitalCount = hospitals.length;
      const doctorsCount = doctors.length;
      const pharmacyCount = pharmacies.length;
      const supermarketCount = supermarkets.length;
      const bankCount = banks.length;
      const postOfficeCount = postOffices.length;
      const busStopCount = busStops.length;
      const tramStopCount = tramStops.length;
      const parkCount = parks.length;

      const education = Math.min(
        100,
        schoolCount * 20 + kindergartenCount * 25
      );
      const healthcare = Math.min(
        100,
        hospitalCount * 30 + doctorsCount * 20 + pharmacyCount * 15
      );
      const shopping = Math.min(
        100,
        supermarketCount * 15 + bankCount * 10 + postOfficeCount * 10
      );
      const transport = Math.min(
        100,
        busStopCount * 5 + tramStopCount * 10
      );
      const greenery = Math.min(100, parkCount * 20);
      const safety = 70; // Placeholder - no data source yet

      const overall =
        education * 0.2 +
        healthcare * 0.2 +
        shopping * 0.15 +
        transport * 0.2 +
        greenery * 0.15 +
        safety * 0.1;

      const score: NeighborhoodScore = {
        location: center,
        overall: Math.round(overall * 10) / 10,
        categories: {
          education: Math.round(education * 10) / 10,
          healthcare: Math.round(healthcare * 10) / 10,
          shopping: Math.round(shopping * 10) / 10,
          transport: Math.round(transport * 10) / 10,
          greenery: Math.round(greenery * 10) / 10,
          safety: Math.round(safety * 10) / 10,
        },
        poiCounts,
        radiusMeters,
        computedAt: new Date().toISOString(),
      };

      this.logger.debug(
        `Neighborhood score at ${lat},${lng}: overall=${score.overall}`
      );

      return score;
    } catch (err) {
      this.logger.error(`Neighborhood score failed: ${err}`);
      throw err;
    }
  }
}
