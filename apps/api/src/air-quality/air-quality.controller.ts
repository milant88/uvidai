import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AirQualityService } from './air-quality.service';
import { AirQualityQueryDto } from './dto/air-quality-query.dto';

@ApiTags('Air Quality')
@Controller('air-quality')
export class AirQualityController {
  constructor(private readonly airQualityService: AirQualityService) {}

  @Get()
  @ApiOperation({ summary: 'Get nearest air quality reading for coordinates' })
  @ApiOkResponse({ description: 'Nearest station reading with distance' })
  async getNearest(@Query() dto: AirQualityQueryDto) {
    const result = await this.airQualityService.getNearest(dto.lat, dto.lng);
    return { success: true, data: result };
  }

  @Get('stations')
  @ApiOperation({ summary: 'List all air quality monitoring stations' })
  @ApiOkResponse({ description: 'All SEPA monitoring stations' })
  async getStations() {
    const stations = await this.airQualityService.getStations();
    return { success: true, data: stations };
  }
}
