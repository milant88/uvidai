import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackSentiment } from '@prisma/client';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto, userId: string) {
    this.logger.debug(`Creating feedback for message ${dto.messageId}`);
    return this.prisma.feedback.create({
      data: {
        messageId: dto.messageId,
        conversationId: dto.conversationId,
        userId,
        sentiment: dto.sentiment as unknown as FeedbackSentiment,
        comment: dto.comment,
        categories: dto.categories ?? [],
      },
    });
  }

  async findByConversation(conversationId: string) {
    return this.prisma.feedback.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
