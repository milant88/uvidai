import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FineTuneService } from './fine-tune.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { CreateDatasetItemDto } from './dto/create-dataset-item.dto';
import { ListDatasetsQueryDto } from './dto/list-datasets.dto';

@ApiTags('Fine-Tune')
@Controller('fine-tune')
export class FineTuneController {
  constructor(private readonly fineTuneService: FineTuneService) {}

  @Post('datasets')
  @ApiOperation({ summary: 'Create a new fine-tune dataset' })
  @ApiCreatedResponse({ description: 'Dataset created' })
  async createDataset(@Body() dto: CreateDatasetDto) {
    const dataset = await this.fineTuneService.createDataset(dto);
    return { success: true, data: dataset };
  }

  @Get('datasets')
  @ApiOperation({ summary: 'List all datasets with pagination' })
  @ApiOkResponse({ description: 'Paginated dataset list' })
  async listDatasets(@Query() query: ListDatasetsQueryDto) {
    const result = await this.fineTuneService.listDatasets(query);
    return { success: true, ...result };
  }

  @Get('datasets/:id')
  @ApiOperation({ summary: 'Get dataset details with item count' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  @ApiOkResponse({ description: 'Dataset with items' })
  async getDataset(@Param('id', ParseUUIDPipe) id: string) {
    const dataset = await this.fineTuneService.getDataset(id);
    return { success: true, data: dataset };
  }

  @Post('datasets/:id/items')
  @ApiOperation({ summary: 'Add an item to a dataset' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  @ApiCreatedResponse({ description: 'Item added' })
  async addDatasetItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDatasetItemDto,
  ) {
    const item = await this.fineTuneService.addDatasetItem(id, dto);
    return { success: true, data: item };
  }

  @Post('datasets/:id/auto-curate')
  @ApiOperation({ summary: 'Auto-populate dataset from highly-rated conversations' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  @ApiOkResponse({ description: 'Auto-curate result' })
  async autoCurate(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.fineTuneService.autoCurate(id);
    return { success: true, data: result };
  }

  @Get('datasets/:id/export')
  @ApiOperation({ summary: 'Export dataset as JSONL (OpenAI fine-tuning format)' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  @ApiOkResponse({ description: 'JSONL file' })
  @Header('Content-Type', 'application/x-ndjson')
  @Header('Content-Disposition', 'attachment; filename="dataset.jsonl"')
  async exportDataset(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const jsonl = await this.fineTuneService.exportJsonl(id);
    res.send(jsonl);
  }

  @Post('datasets/:id/train')
  @ApiOperation({ summary: 'Trigger a fine-tuning job' })
  @ApiParam({ name: 'id', description: 'Dataset UUID' })
  @ApiCreatedResponse({ description: 'Job ID returned' })
  async train(@Param('id', ParseUUIDPipe) id: string) {
    const { jobId } = await this.fineTuneService.train(id);
    return { success: true, data: { jobId } };
  }

  @Get('jobs/:jobId/status')
  @ApiOperation({ summary: 'Check fine-tuning job status' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiOkResponse({ description: 'Job status' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = this.fineTuneService.getJobStatus(jobId);
    return { success: true, data: status };
  }
}
