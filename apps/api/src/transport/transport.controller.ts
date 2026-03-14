import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import {
  TransportStopsQueryDto,
  TransportCommuteQueryDto,
} from './dto/transport-query.dto';

@ApiTags('Transport')
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('stops')
  @ApiOperation({ summary: 'Find transit stops near a point' })
  @ApiOkResponse({ description: 'List of bus and tram stops within radius' })
  async getStops(@Query() dto: TransportStopsQueryDto) {
    const result = await this.transportService.getStops(
      dto.lat,
      dto.lng,
      dto.radius ?? 1000
    );
    return { success: true, data: result };
  }

  @Get('commute')
  @ApiOperation({ summary: 'Estimate commute time between two points' })
  @ApiOkResponse({
    description: 'Walking, bus, and car time estimates plus nearest stops',
  })
  async getCommute(@Query() dto: TransportCommuteQueryDto) {
    const result = await this.transportService.getCommuteEstimate(
      dto.fromLat,
      dto.fromLng,
      dto.toLat,
      dto.toLng
    );
    return { success: true, data: result };
  }
}
