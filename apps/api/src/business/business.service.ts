import { Injectable, Logger } from '@nestjs/common';
import { OverpassHttpClient } from '@uvidai/data-connectors';
import type { POICategory } from '@uvidai/shared';

const BUSINESS_CATEGORIES: POICategory[] = [
  'restaurant',
  'cafe',
  'pharmacy',
  'gym',
  'supermarket',
  'bank',
  'fuel',
  'library',
];

type CompetitionLevel = 'low' | 'medium' | 'high';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);
  private readonly overpass = new OverpassHttpClient();

  async scan(
    lat: number,
    lng: number,
    category: string,
    radiusMeters = 1000
  ): Promise<{
    count: number;
    densityPerSqKm: number;
    competitionLevel: CompetitionLevel;
  }> {
    try {
      const validCategory = BUSINESS_CATEGORIES.includes(
        category as POICategory
      );
      if (!validCategory) {
        return {
          count: 0,
          densityPerSqKm: 0,
          competitionLevel: 'low',
        };
      }

      const results = await this.overpass.queryPOIs({
        center: { lat, lng },
        radiusMeters,
        categories: [category as POICategory],
      });

      const count = results.length;
      const areaSqKm = Math.PI * Math.pow(radiusMeters / 1000, 2);
      const densityPerSqKm = areaSqKm > 0 ? count / areaSqKm : 0;

      // Competition: low < 5, medium 5-15, high > 15 per km²
      let competitionLevel: CompetitionLevel = 'low';
      if (densityPerSqKm >= 15) competitionLevel = 'high';
      else if (densityPerSqKm >= 5) competitionLevel = 'medium';

      this.logger.debug(
        `Business scan ${category}: ${count} POIs, density=${densityPerSqKm.toFixed(1)}/km²`
      );

      return {
        count,
        densityPerSqKm: Math.round(densityPerSqKm * 10) / 10,
        competitionLevel,
      };
    } catch (err) {
      this.logger.error(`Business scan failed: ${err}`);
      throw err;
    }
  }

  async getOpportunities(
    lat: number,
    lng: number,
    radiusMeters = 1000
  ): Promise<{
    opportunities: Array<{
      category: string;
      count: number;
      avgCount: number;
      gap: number;
      suggestion: string;
    }>;
  }> {
    try {
      const countsByCategory: Record<string, number> = {};
      for (const cat of BUSINESS_CATEGORIES) {
        const results = await this.overpass.queryPOIs({
          center: { lat, lng },
          radiusMeters,
          categories: [cat],
        });
        countsByCategory[cat] = results.length;
      }

      const values = Object.values(countsByCategory);
      const avgCount =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;

      const opportunities: Array<{
        category: string;
        count: number;
        avgCount: number;
        gap: number;
        suggestion: string;
      }> = [];

      for (const [cat, count] of Object.entries(countsByCategory)) {
        const gap = avgCount - count;
        if (gap > 1 && count < avgCount * 0.5) {
          opportunities.push({
            category: cat,
            count,
            avgCount: Math.round(avgCount * 10) / 10,
            gap: Math.round(gap * 10) / 10,
            suggestion: `Underserved ${cat} market - ${count} vs area average ${avgCount.toFixed(1)}`,
          });
        }
      }

      opportunities.sort((a, b) => b.gap - a.gap);

      this.logger.debug(
        `Business opportunities: ${opportunities.length} underserved categories`
      );

      return { opportunities };
    } catch (err) {
      this.logger.error(`Business opportunities failed: ${err}`);
      throw err;
    }
  }
}
