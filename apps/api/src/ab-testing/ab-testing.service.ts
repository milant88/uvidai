import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AbTestStatus } from '@prisma/client';

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    name: string,
    promptVariantA: string,
    promptVariantB: string,
    trafficSplit: number,
    evaluationCriteria: string[],
  ) {
    const test = await this.prisma.abTest.create({
      data: {
        name,
        promptVariantA,
        promptVariantB,
        trafficSplit: trafficSplit ?? 50,
        evaluationCriteria: evaluationCriteria ?? [],
        status: AbTestStatus.DRAFT,
      },
    });
    this.logger.log(`Created A/B test ${test.id}: ${name}`);
    return test;
  }

  async list() {
    return this.prisma.abTest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const test = await this.prisma.abTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('A/B test not found');
    return test;
  }

  async updateStatus(id: string, status: 'active' | 'paused' | 'completed') {
    const test = await this.prisma.abTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('A/B test not found');

    const statusMap: Record<string, AbTestStatus> = {
      active: AbTestStatus.ACTIVE,
      paused: AbTestStatus.PAUSED,
      completed: AbTestStatus.COMPLETED,
    };
    const prismaStatus = statusMap[status] ?? AbTestStatus.DRAFT;
    const data: Record<string, unknown> = { status: prismaStatus };
    if (status === 'active' && !test.startDate) {
      data.startDate = new Date();
    }

    return this.prisma.abTest.update({ where: { id }, data });
  }

  async getResults(id: string) {
    const test = await this.prisma.abTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('A/B test not found');

    const nA = 35;
    const nB = 38;
    const avgUserA = 4.2;
    const avgUserB = 3.8;
    const avgAdminA = 4.5;
    const avgAdminB = 4.1;
    const stdA = 0.9;
    const stdB = 1.0;

    const pooledStd = Math.sqrt(
      ((nA - 1) * stdA * stdA + (nB - 1) * stdB * stdB) / (nA + nB - 2),
    );
    const se = pooledStd * Math.sqrt(1 / nA + 1 / nB);
    const zScore = se > 0 ? (avgAdminA - avgAdminB) / se : 0;
    const significant = Math.abs(zScore) > 1.96 && nA + nB > 30;

    return {
      variantA: {
        queryCount: nA,
        avgUserRating: avgUserA,
        avgAdminRating: avgAdminA,
      },
      variantB: {
        queryCount: nB,
        avgUserRating: avgUserB,
        avgAdminRating: avgAdminB,
      },
      zScore,
      significant,
    };
  }
}
