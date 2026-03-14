import { Injectable, Logger } from '@nestjs/common';
import { SepaHttpClient } from '@uvidai/data-connectors';

@Injectable()
export class AirQualityService {
  private readonly logger = new Logger(AirQualityService.name);
  private readonly sepa = new SepaHttpClient();

  async getNearest(lat: number, lng: number) {
    this.logger.debug(`Nearest air quality reading for ${lat}, ${lng}`);
    return this.sepa.getNearestReading({ lat, lng });
  }

  async getStations() {
    this.logger.debug('Listing air quality stations');
    return this.sepa.getStations();
  }
}
