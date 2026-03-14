import { Injectable, Logger } from '@nestjs/common';
import { OverpassHttpClient } from '@uvidai/data-connectors';
import type { POIResult } from '@uvidai/data-connectors';
import type { POICategory } from '@uvidai/shared';

const ALL_CATEGORIES: POICategory[] = [
  'school', 'kindergarten', 'hospital', 'doctors', 'pharmacy',
  'bank', 'post_office', 'supermarket', 'park', 'restaurant',
  'cafe', 'bus_station', 'tram_stop', 'parking', 'fuel',
  'gym', 'library', 'place_of_worship',
];

@Injectable()
export class PoiService {
  private readonly logger = new Logger(PoiService.name);
  private readonly overpass = new OverpassHttpClient();

  async search(
    lat: number,
    lng: number,
    radiusMeters = 1000,
    categoryFilter?: string,
  ): Promise<POIResult[]> {
    const categories: POICategory[] = categoryFilter
      ? (categoryFilter.split(',').filter((c) =>
          ALL_CATEGORIES.includes(c as POICategory),
        ) as POICategory[])
      : ALL_CATEGORIES;

    if (categories.length === 0) {
      return [];
    }

    this.logger.debug(
      `POI search at ${lat},${lng} r=${radiusMeters}m cats=${categories.join(',')}`,
    );

    return this.overpass.queryPOIs({
      center: { lat, lng },
      radiusMeters,
      categories,
    });
  }
}
