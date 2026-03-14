import { Injectable, Logger } from '@nestjs/common';
import {
  HaloOglasiClient,
  type ListingSearchParams,
  type PriceEstimate,
  type RealEstateListing,
} from '@uvidai/data-connectors';
import type { ListingSearchQueryDto } from './dto/listing-search.dto';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly client = new HaloOglasiClient();

  async estimatePrice(
    lat: number,
    lng: number,
    type: 'apartment' | 'house' | 'land' | 'commercial',
    area?: number
  ): Promise<PriceEstimate> {
    this.logger.debug(`Price estimate for ${lat}, ${lng}, type=${type}, area=${area}`);
    return this.client.estimatePrice({ lat, lng }, type, area);
  }

  async searchListings(params: ListingSearchQueryDto): Promise<RealEstateListing[]> {
    this.logger.debug(`Search listings: ${JSON.stringify(params)}`);
    const searchParams: ListingSearchParams = {
      city: params.city,
      type: params.type,
      transactionType: params.transactionType,
      page: params.page,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minArea: params.minArea,
      maxArea: params.maxArea,
      municipality: params.municipality,
      limit: params.limit,
    };
    return this.client.searchListings(searchParams);
  }
}
