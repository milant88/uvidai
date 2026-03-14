import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AbTestingService } from './ab-testing.service';
import { CreateAbTestDto } from './dto/create-ab-test.dto';
import { UpdateAbTestDto } from './dto/update-ab-test.dto';

@ApiTags('A/B Testing')
@Controller('ab-tests')
export class AbTestingController {
  constructor(private readonly abTestingService: AbTestingService) {}

  @Post()
  @ApiOperation({ summary: 'Create A/B test' })
  @ApiCreatedResponse({ description: 'A/B test created' })
  async create(@Body() dto: CreateAbTestDto) {
    const test = this.abTestingService.create(
      dto.name,
      dto.promptVariantA,
      dto.promptVariantB,
      dto.trafficSplit ?? 50,
      dto.evaluationCriteria ?? [],
    );
    return { success: true, data: test };
  }

  @Get()
  @ApiOperation({ summary: 'List all A/B tests' })
  @ApiOkResponse({ description: 'List of A/B tests' })
  async list() {
    const tests = this.abTestingService.list();
    return { success: true, data: tests };
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get statistical comparison of variants' })
  @ApiParam({ name: 'id', description: 'A/B test ID' })
  @ApiOkResponse({ description: 'Variant comparison results' })
  async getResults(@Param('id') id: string) {
    const results = this.abTestingService.getResults(id);
    return { success: true, data: results };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get A/B test details with results' })
  @ApiParam({ name: 'id', description: 'A/B test ID' })
  @ApiOkResponse({ description: 'A/B test details' })
  async get(@Param('id') id: string) {
    const test = this.abTestingService.get(id);
    const results = this.abTestingService.getResults(id);
    return { success: true, data: { ...test, results } };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update A/B test status (activate/pause/complete)' })
  @ApiParam({ name: 'id', description: 'A/B test ID' })
  @ApiOkResponse({ description: 'Updated A/B test' })
  async update(@Param('id') id: string, @Body() dto: UpdateAbTestDto) {
    const test = this.abTestingService.updateStatus(id, dto.status);
    return { success: true, data: test };
  }
}
