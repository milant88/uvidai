import { Injectable, Logger } from '@nestjs/common';
import { NominatimClient } from '@uvidai/data-connectors';
import type { GeocodingResult } from '@uvidai/data-connectors';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly nominatim = new NominatimClient();

  async search(query: string): Promise<GeocodingResult[]> {
    this.logger.debug(`Geocoding: "${query}"`);
    return this.nominatim.geocode(query, {
      countryCodes: ['rs'],
      limit: 5,
    });
  }

  async reverse(lat: number, lng: number): Promise<GeocodingResult | null> {
    this.logger.debug(`Reverse geocode: ${lat}, ${lng}`);
    return this.nominatim.reverse({ lat, lng });
  }
}
