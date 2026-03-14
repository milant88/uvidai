import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetStatus, DatasetItemSource } from '@prisma/client';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { CreateDatasetItemDto } from './dto/create-dataset-item.dto';
import { ListDatasetsQueryDto } from './dto/list-datasets.dto';

const TEMP_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';

@Injectable()
export class FineTuneService {
  private readonly logger = new Logger(FineTuneService.name);
  private readonly jobStatusMap = new Map<
    string,
    { status: 'TRAINING' | 'COMPLETED'; datasetId: string }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async createDataset(dto: CreateDatasetDto) {
    return this.prisma.fineTuneDataset.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        createdBy: TEMP_ADMIN_USER_ID,
        modelProvider: dto.modelProvider ?? null,
        status: DatasetStatus.DRAFT,
      },
    });
  }

  async listDatasets(query: ListDatasetsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.fineTuneDataset.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.fineTuneDataset.count(),
    ]);

    return {
      data: items.map((d) => ({
        ...d,
        itemCount: d._count.items,
        _count: undefined,
      })),
      pagination: { page, limit, total },
    };
  }

  async getDataset(id: string) {
    const dataset = await this.prisma.fineTuneDataset.findUnique({
      where: { id },
      include: { items: true, _count: { select: { items: true } } },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');
    return {
      ...dataset,
      itemCount: dataset._count.items,
      _count: undefined,
    };
  }

  async addDatasetItem(datasetId: string, dto: CreateDatasetItemDto) {
    const dataset = await this.prisma.fineTuneDataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.status !== DatasetStatus.DRAFT && dataset.status !== DatasetStatus.READY) {
      throw new BadRequestException(
        'Cannot add items to dataset in TRAINING or DEPLOYED status',
      );
    }

    const messages = Array.isArray(dto.inputMessagesJson)
      ? dto.inputMessagesJson
      : [dto.inputMessagesJson];
    const inputJson = messages as unknown[];

    const item = await this.prisma.fineTuneDatasetItem.create({
      data: {
        datasetId,
        inputMessagesJson: inputJson as object,
        idealOutput: dto.idealOutput,
        source: dto.source as DatasetItemSource,
      },
    });

    await this.prisma.fineTuneDataset.update({
      where: { id: datasetId },
      data: { messageCount: { increment: 1 } },
    });

    return item;
  }

  async autoCurate(datasetId: string) {
    const dataset = await this.prisma.fineTuneDataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.status !== DatasetStatus.DRAFT && dataset.status !== DatasetStatus.READY) {
      throw new BadRequestException(
        'Cannot auto-curate dataset in TRAINING or DEPLOYED status',
      );
    }

    const highRated = await this.prisma.adminRating.findMany({
      where: {
        OR: [
          {
            accuracy: { gte: 4 },
            completeness: { gte: 4 },
            relevance: { gte: 4 },
            tone: { gte: 4 },
          },
          { idealResponseText: { not: null } },
        ],
      },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const seenMessageIds = new Set<string>();
    let added = 0;

    for (const rating of highRated) {
      const msg = rating.message;
      if (seenMessageIds.has(msg.id)) continue;
      seenMessageIds.add(msg.id);

      const conv = msg.conversation;
      const allMsgs = conv.messages;
      const assistantIdx = allMsgs.findIndex((m) => m.id === msg.id);
      if (assistantIdx < 0) continue;

      const beforeMsgs = allMsgs.slice(0, assistantIdx);
      const systemMsgs = beforeMsgs.filter((m) => m.role === 'SYSTEM');
      const userMsgs = beforeMsgs.filter((m) => m.role === 'USER');
      const inputMessages = [
        ...systemMsgs.map((m) => ({ role: 'system' as const, content: m.content })),
        ...userMsgs.map((m) => ({ role: 'user' as const, content: m.content })),
      ];
      if (inputMessages.length === 0) continue;

      const idealOutput = rating.idealResponseText ?? msg.content;

      await this.prisma.fineTuneDatasetItem.create({
        data: {
          datasetId,
          inputMessagesJson: inputMessages as object,
          idealOutput,
          source: DatasetItemSource.HIGH_RATED,
        },
      });
      added++;
    }

    const count = await this.prisma.fineTuneDatasetItem.count({
      where: { datasetId },
    });
    await this.prisma.fineTuneDataset.update({
      where: { id: datasetId },
      data: { messageCount: count },
    });

    this.logger.log(`Auto-curated ${added} items into dataset ${datasetId}`);
    return { added, totalItems: count };
  }

  async exportJsonl(datasetId: string): Promise<string> {
    const dataset = await this.prisma.fineTuneDataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    const items = await this.prisma.fineTuneDatasetItem.findMany({
      where: { datasetId },
      orderBy: { createdAt: 'asc' },
    });

    const lines = items.map((item) => {
      const input = item.inputMessagesJson as Array<{ role: string; content: string }>;
      const messages = [
        ...(Array.isArray(input) ? input : [input]).map((m) => ({
          role: m.role ?? 'user',
          content: typeof m.content === 'string' ? m.content : String(m.content),
        })),
        { role: 'assistant', content: item.idealOutput },
      ];
      return JSON.stringify({ messages });
    });

    return lines.join('\n');
  }

  async train(datasetId: string): Promise<{ jobId: string }> {
    const dataset = await this.prisma.fineTuneDataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.status !== DatasetStatus.READY && dataset.status !== DatasetStatus.DRAFT) {
      throw new BadRequestException(
        'Dataset must be in READY or DRAFT status to start training',
      );
    }

    const jobId = `ft-job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.jobStatusMap.set(jobId, { status: 'TRAINING', datasetId });

    await this.prisma.fineTuneDataset.update({
      where: { id: datasetId },
      data: { status: DatasetStatus.TRAINING },
    });

    this.logger.log(`Started fine-tune job ${jobId} for dataset ${datasetId}`);
    return { jobId };
  }

  getJobStatus(jobId: string): { status: 'TRAINING' | 'COMPLETED' } {
    const entry = this.jobStatusMap.get(jobId);
    if (!entry) {
      return { status: 'TRAINING' };
    }
    return { status: entry.status };
  }
}
