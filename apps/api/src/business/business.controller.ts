import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import {
  BusinessScanQueryDto,
  BusinessOpportunitiesQueryDto,
} from './dto/business-query.dto';

@ApiTags('Business Scanner')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('scan')
  @ApiOperation({ summary: 'Scan business density for a category' })
  @ApiOkResponse({
    description: 'Count, density per km², and competition level',
  })
  async scan(@Query() dto: BusinessScanQueryDto) {
    const result = await this.businessService.scan(
      dto.lat,
      dto.lng,
      dto.category,
      dto.radius ?? 1000
    );
    return { success: true, data: result };
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Find underserved business categories' })
  @ApiOkResponse({
    description: 'Categories with fewer POIs than area average',
  })
  async getOpportunities(@Query() dto: BusinessOpportunitiesQueryDto) {
    const result = await this.businessService.getOpportunities(
      dto.lat,
      dto.lng,
      dto.radius ?? 1000
    );
    return { success: true, data: result };
  }
}
