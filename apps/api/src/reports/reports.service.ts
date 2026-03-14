import { Injectable, Logger } from '@nestjs/common';
import { OverpassHttpClient } from '@uvidai/data-connectors';
import type { POIResult } from '@uvidai/data-connectors';
import type { NeighborhoodScore, POI } from '@uvidai/shared';
import type { PriceEstimate } from '@uvidai/data-connectors';
import { AirQualityService } from '../air-quality/air-quality.service';
import { NeighborhoodService } from '../neighborhood/neighborhood.service';
import { PriceService } from '../price/price.service';
import { TransportService } from '../transport/transport.service';
import { LocationService } from '../location/location.service';

const BELGRADE_CENTER = { lat: 44.8176, lng: 20.4569 };

function toPOI(r: POIResult): POI {
  return {
    id: r.osmId,
    osmId: r.osmId,
    name: r.name,
    category: r.category,
    coordinates: r.coordinates,
    distanceMeters: r.distanceMeters,
    tags: r.tags,
  };
}

export interface LocationReport {
  location: { lat: number; lng: number; address: string };
  generatedAt: string;
  neighborhoodScore: NeighborhoodScore;
  airQuality: { aqi: number; category: string; stationName: string };
  education: { schools: POI[]; kindergartens: POI[] };
  healthcare: {
    hospitals: POI[];
    doctors: POI[];
    pharmacies: POI[];
  };
  transport: {
    stops: POI[];
    commuteEstimate: { walkingMin: number; busMin: number; carMin: number };
  };
  priceEstimate?: PriceEstimate;
  summary: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly overpass = new OverpassHttpClient();

  constructor(
    private readonly airQualityService: AirQualityService,
    private readonly neighborhoodService: NeighborhoodService,
    private readonly priceService: PriceService,
    private readonly transportService: TransportService,
    private readonly locationService: LocationService,
  ) {}

  async getLocationReport(
    lat: number,
    lng: number,
    radiusMeters = 1000
  ): Promise<LocationReport> {
    try {
      const center = { lat, lng };

      const [
        addressResult,
        neighborhoodScore,
        airQualityResult,
        priceEstimate,
        transportStops,
        commuteEstimate,
        schools,
        kindergartens,
        hospitals,
        doctors,
        pharmacies,
      ] = await Promise.all([
        this.locationService.reverse(lat, lng),
        this.neighborhoodService.getScore(lat, lng, radiusMeters),
        this.airQualityService.getNearest(lat, lng),
        this.priceService
          .estimatePrice(lat, lng, 'apartment')
          .catch(() => undefined),
        this.transportService.getStops(lat, lng, radiusMeters),
        this.transportService.getCommuteEstimate(
          lat,
          lng,
          BELGRADE_CENTER.lat,
          BELGRADE_CENTER.lng
        ),
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
      ]);

      const address = addressResult?.displayName ?? `${lat}, ${lng}`;

      const airQuality = airQualityResult
        ? {
            aqi: airQualityResult.reading.aqi,
            category: airQualityResult.reading.category,
            stationName: airQualityResult.station.name,
          }
        : { aqi: 0, category: 'unknown', stationName: '' };

      const summary = this.buildSummary({
        address,
        neighborhoodScore,
        airQuality,
        schoolCount: schools.length,
        kindergartenCount: kindergartens.length,
        hospitalCount: hospitals.length,
        doctorCount: doctors.length,
        pharmacyCount: pharmacies.length,
        stopCount: transportStops.length,
        commuteEstimate,
        priceEstimate,
      });

      return {
        location: { lat, lng, address },
        generatedAt: new Date().toISOString(),
        neighborhoodScore,
        airQuality,
        education: {
          schools: schools.map(toPOI),
          kindergartens: kindergartens.map(toPOI),
        },
        healthcare: {
          hospitals: hospitals.map(toPOI),
          doctors: doctors.map(toPOI),
          pharmacies: pharmacies.map(toPOI),
        },
        transport: {
          stops: transportStops.map(toPOI),
          commuteEstimate: {
            walkingMin: commuteEstimate.walkingMinutes,
            busMin: commuteEstimate.busMinutes,
            carMin: commuteEstimate.carMinutes,
          },
        },
        priceEstimate,
        summary,
      };
    } catch (err) {
      this.logger.error(`Location report failed: ${err}`);
      throw err;
    }
  }

  private buildSummary(ctx: {
    address: string;
    neighborhoodScore: NeighborhoodScore;
    airQuality: { aqi: number; category: string; stationName: string };
    schoolCount: number;
    kindergartenCount: number;
    hospitalCount: number;
    doctorCount: number;
    pharmacyCount: number;
    stopCount: number;
    commuteEstimate: {
      walkingMinutes: number;
      busMinutes: number;
      carMinutes: number;
    };
    priceEstimate?: PriceEstimate;
  }): string {
    const parts: string[] = [];
    parts.push(
      `Location: ${ctx.address}. Neighborhood livability score: ${ctx.neighborhoodScore.overall}/100.`
    );
    parts.push(
      `Education: ${ctx.schoolCount} schools, ${ctx.kindergartenCount} kindergartens.`
    );
    parts.push(
      `Healthcare: ${ctx.hospitalCount} hospitals, ${ctx.doctorCount} doctors, ${ctx.pharmacyCount} pharmacies.`
    );
    parts.push(
      `Transport: ${ctx.stopCount} stops nearby. Commute to city center: ~${ctx.commuteEstimate.busMinutes} min by bus, ~${ctx.commuteEstimate.carMinutes} min by car.`
    );
    parts.push(
      `Air quality: AQI ${ctx.airQuality.aqi} (${ctx.airQuality.category})${ctx.airQuality.stationName ? ` from ${ctx.airQuality.stationName}` : ''}.`
    );
    if (ctx.priceEstimate) {
      parts.push(
        `Price estimate: ~${ctx.priceEstimate.estimatedPricePerSqm} EUR/m² (${ctx.priceEstimate.confidenceLevel} confidence, ${ctx.priceEstimate.sampleSize} samples).`
      );
    }
    return parts.join(' ');
  }
}
