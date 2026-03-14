import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { PriceEstimateQueryDto } from './dto/price-estimate.dto';
import { ListingSearchQueryDto } from './dto/listing-search.dto';

@ApiTags('Price (Cena Radar)')
@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get('estimate')
  @ApiOperation({ summary: 'Get price estimate for coordinates' })
  @ApiOkResponse({ description: 'Price estimate per m² and aggregate stats' })
  async estimate(@Query() dto: PriceEstimateQueryDto) {
    const result = await this.priceService.estimatePrice(
      dto.lat,
      dto.lng,
      dto.type ?? 'apartment',
      dto.area
    );
    return { success: true, data: result };
  }

  @Get('listings')
  @ApiOperation({ summary: 'Search real estate listings' })
  @ApiOkResponse({ description: 'List of listings from halooglasi' })
  async listings(@Query() dto: ListingSearchQueryDto) {
    const results = await this.priceService.searchListings(dto);
    return { success: true, data: results };
  }
}
