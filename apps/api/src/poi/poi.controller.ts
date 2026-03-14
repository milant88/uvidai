import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PoiService } from './poi.service';
import { SearchPoiDto } from './dto/search-poi.dto';

@ApiTags('POIs')
@Controller('pois')
export class PoiController {
  constructor(private readonly poiService: PoiService) {}

  @Get()
  @ApiOperation({ summary: 'Search points of interest near a location' })
  @ApiOkResponse({ description: 'List of POIs sorted by distance' })
  async search(@Query() dto: SearchPoiDto) {
    const results = await this.poiService.search(
      dto.lat,
      dto.lng,
      dto.radius,
      dto.categories,
    );
    return { success: true, data: results };
  }
}
