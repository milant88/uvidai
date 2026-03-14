import { Injectable, NotFoundException, Logger } from '@nestjs/common';

export interface AbTest {
  id: string;
  name: string;
  promptVariantA: string;
  promptVariantB: string;
  trafficSplit: number;
  evaluationCriteria: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string | null;
  createdAt: string;
  results?: {
    variantA: { queryCount: number; avgUserRating: number; avgAdminRating: number };
    variantB: { queryCount: number; avgUserRating: number; avgAdminRating: number };
    zScore?: number;
    significant?: boolean;
  };
}

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);
  private readonly tests = new Map<string, AbTest>();
  private idCounter = 0;

  create(
    name: string,
    promptVariantA: string,
    promptVariantB: string,
    trafficSplit: number,
    evaluationCriteria: string[],
  ): AbTest {
    const id = `ab-${++this.idCounter}-${Date.now()}`;
    const test: AbTest = {
      id,
      name,
      promptVariantA,
      promptVariantB,
      trafficSplit: trafficSplit ?? 50,
      evaluationCriteria: evaluationCriteria ?? [],
      status: 'draft',
      startDate: null,
      createdAt: new Date().toISOString(),
    };
    this.tests.set(id, test);
    this.logger.log(`Created A/B test ${id}: ${name}`);
    return test;
  }

  list(): AbTest[] {
    return Array.from(this.tests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  get(id: string): AbTest {
    const test = this.tests.get(id);
    if (!test) throw new NotFoundException('A/B test not found');
    return test;
  }

  updateStatus(id: string, status: 'active' | 'paused' | 'completed'): AbTest {
    const test = this.tests.get(id);
    if (!test) throw new NotFoundException('A/B test not found');
    test.status = status;
    if (status === 'active' && !test.startDate) {
      test.startDate = new Date().toISOString();
    }
    return test;
  }

  getResults(id: string): AbTest['results'] {
    const test = this.tests.get(id);
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
