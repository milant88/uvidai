import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { SearchLocationDto, ReverseGeocodeDto } from './dto/search-location.dto';

@ApiTags('Locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('search')
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiOkResponse({ description: 'List of matching locations' })
  async search(@Query() dto: SearchLocationDto) {
    const results = await this.locationService.search(dto.q);
    return { success: true, data: results };
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to an address' })
  @ApiOkResponse({ description: 'Location details for the coordinates' })
  async reverse(@Query() dto: ReverseGeocodeDto) {
    const result = await this.locationService.reverse(dto.lat, dto.lng);
    return { success: true, data: result };
  }
}
