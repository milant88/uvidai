import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportLocationQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('location')
  @ApiOperation({ summary: 'Generate comprehensive location report' })
  @ApiOkResponse({
    description:
      'Aggregated report with neighborhood score, air quality, education, healthcare, transport, and price estimate',
  })
  async getLocationReport(@Query() dto: ReportLocationQueryDto) {
    const result = await this.reportsService.getLocationReport(
      dto.lat,
      dto.lng,
      dto.radius ?? 1000
    );
    return { success: true, data: result };
  }
}
