import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageRole } from '@prisma/client';
import { AdminRatingDto } from './dto/admin-rating.dto';
import {
  AdminConversationsQueryDto,
  AdminRatingsQueryDto,
  AdminFeedbackQueryDto,
  AdminAnalyticsQueryDto,
} from './dto/admin-query.dto';

const TEMP_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalConversations, messagesToday, avgLatency, totalFeedback] =
      await Promise.all([
        this.prisma.conversation.count(),
        this.prisma.message.count({
          where: { createdAt: { gte: today } },
        }),
        this.prisma.message.aggregate({
          where: {
            role: MessageRole.ASSISTANT,
            latencyMs: { not: null },
          },
          _avg: { latencyMs: true },
        }),
        this.prisma.feedback.count(),
      ]);

    const tokenUsage = await this.prisma.message.aggregate({
      where: { role: MessageRole.ASSISTANT },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
    });

    const totalTokens = tokenUsage._sum.totalTokens ?? 0;
    const aiCost = totalTokens > 0 ? (totalTokens / 1_000_000) * 2.5 : 0;

    return {
      totalConversations,
      messagesToday,
      avgResponseTimeMs: avgLatency._avg.latencyMs ?? 0,
      aiCost: Math.round(aiCost * 100) / 100,
      totalFeedback,
    };
  }

  async listConversations(query: AdminConversationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.language) {
      where.language = query.language;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = to;
      }
    }
    if (query.module) {
      where.messages = {
        some: { module: query.module },
      };
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      meta: { page, limit, total },
    };
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async submitRating(dto: AdminRatingDto) {
    return this.prisma.adminRating.create({
      data: {
        messageId: dto.messageId,
        conversationId: (
          await this.prisma.message.findUniqueOrThrow({
            where: { id: dto.messageId },
            select: { conversationId: true },
          })
        ).conversationId,
        adminUserId: TEMP_ADMIN_USER_ID,
        accuracy: dto.accuracy,
        completeness: dto.completeness,
        relevance: dto.relevance,
        tone: dto.tone,
        idealResponseText: dto.idealResponseText,
        notes: dto.notes,
        tags: dto.tags ?? [],
      },
    });
  }

  async listRatings(query: AdminRatingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.prisma.adminRating.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminRating.count(),
    ]);

    return {
      data: ratings,
      meta: { page, limit, total },
    };
  }

  async getUnratedMessages(limit = 20) {
    const ratedMessageIds = await this.prisma.adminRating
      .findMany({ select: { messageId: true } })
      .then((r) => r.map((x) => x.messageId));

    const messages = await this.prisma.message.findMany({
      where: {
        role: MessageRole.ASSISTANT,
        id: { notIn: ratedMessageIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { data: messages };
  }

  async listFeedback(query: AdminFeedbackQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.sentiment) {
      where.sentiment = query.sentiment;
    }

    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: feedback,
      meta: { page, limit, total },
    };
  }

  async getUsageAnalytics(query: AdminAnalyticsQueryDto) {
    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo
      ? new Date(query.dateTo)
      : new Date();

    const messages = await this.prisma.message.findMany({
      where: {
        role: MessageRole.USER,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { createdAt: true, module: true },
    });

    const dateMap = new Map<string, number>();
    const moduleMap = new Map<string, number>();
    for (const m of messages) {
      const key = m.createdAt.toISOString().slice(0, 10);
      dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
      const mod = m.module ?? 'unknown';
      moduleMap.set(mod, (moduleMap.get(mod) ?? 0) + 1);
    }

    return {
      queryVolumeByDate: Array.from(dateMap.entries())
        .map(([date, queries]) => ({ date, queries }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      moduleBreakdown: Array.from(moduleMap.entries()).map(([module, count]) => ({
        module,
        count,
      })),
    };
  }

  async getAiPerformance(query: AdminAnalyticsQueryDto) {
    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo
      ? new Date(query.dateTo)
      : new Date();

    const messages = await this.prisma.message.findMany({
      where: {
        role: MessageRole.ASSISTANT,
        createdAt: { gte: dateFrom, lte: dateTo },
        latencyMs: { not: null },
      },
      select: {
        latencyMs: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        provider: true,
      },
    });

    const latencies = messages
      .map((m) => m.latencyMs!)
      .sort((a, b) => a - b);
    const len = latencies.length;

    const percentile = (p: number) =>
      len > 0 ? latencies[Math.floor((p / 100) * len)] ?? 0 : 0;

    const tokenSum = messages.reduce(
      (acc, m) => ({
        prompt: acc.prompt + (m.promptTokens ?? 0),
        completion: acc.completion + (m.completionTokens ?? 0),
        total: acc.total + (m.totalTokens ?? 0),
      }),
      { prompt: 0, completion: 0, total: 0 },
    );

    const byProvider = messages.reduce<Record<string, { tokens: number; count: number }>>(
      (acc, m) => {
        const p = m.provider ?? 'unknown';
        if (!acc[p]) acc[p] = { tokens: 0, count: 0 };
        acc[p].tokens += m.totalTokens ?? 0;
        acc[p].count += 1;
        return acc;
      },
      {},
    );

    const costEstimate = (tokenSum.total / 1_000_000) * 2.5;

    return {
      tokensUsed: tokenSum,
      costEstimate: Math.round(costEstimate * 100) / 100,
      latencyPercentiles: {
        p50: percentile(50),
        p75: percentile(75),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99),
      },
      byProvider: Object.entries(byProvider).map(([provider, data]) => ({
        provider,
        tokens: data.tokens,
        requestCount: data.count,
      })),
    };
  }
}
