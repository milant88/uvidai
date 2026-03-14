import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { NeighborhoodService } from './neighborhood.service';
import { NeighborhoodScoreQueryDto } from './dto/neighborhood-query.dto';

@ApiTags('Neighborhood Score')
@Controller('neighborhood')
export class NeighborhoodController {
  constructor(private readonly neighborhoodService: NeighborhoodService) {}

  @Get('score')
  @ApiOperation({ summary: 'Calculate neighborhood livability score' })
  @ApiOkResponse({
    description: 'Overall score and category breakdown (education, healthcare, etc.)',
  })
  async getScore(@Query() dto: NeighborhoodScoreQueryDto) {
    const result = await this.neighborhoodService.getScore(
      dto.lat,
      dto.lng,
      dto.radius ?? 1000
    );
    return { success: true, data: result };
  }
}
