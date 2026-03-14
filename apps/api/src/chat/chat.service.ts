import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MessageRole } from '@prisma/client';
import { ChatInputDto } from './dto/chat-input.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async chat(dto: ChatInputDto, userId: string) {
    const start = Date.now();

    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title: dto.message.slice(0, 100),
          locationAddress: dto.location?.address,
          locationLat: dto.location?.lat,
          locationLng: dto.location?.lng,
          language: dto.locale ?? 'sr-Latn',
        },
      });
      conversationId = conversation.id;
    }

    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: dto.message,
      },
    });

    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    let assistantContent: string;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let agentsUsed: string[] = [];

    try {
      const { GeminiProvider, AgentOrchestrator } = await import(
        '@uvidai/ai-core'
      );
      const apiKey = this.config.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const provider = new GeminiProvider({
        provider: 'gemini',
        apiKey,
        chatModel: 'gemini-2.0-flash',
      });

      const orchestrator = new AgentOrchestrator(provider);

      const chatHistory = history.map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      const result = await orchestrator.processQuery(
        {
          history: chatHistory,
          locale: dto.locale ?? 'sr-Latn',
          location: dto.location
            ? {
                address: dto.location.address,
                lat: dto.location.lat,
                lng: dto.location.lng,
              }
            : undefined,
          conversationId,
          userId,
        },
        dto.message,
      );

      assistantContent = result.content;
      promptTokens = result.totalUsage.promptTokens;
      completionTokens = result.totalUsage.completionTokens;
      totalTokens = result.totalUsage.totalTokens;
      agentsUsed = result.agentsUsed;

      this.logger.log(
        `Orchestrator routed to [${agentsUsed.join(', ')}] ` +
          `(${result.toolCallsHistory.length} tool calls, ${totalTokens} tokens)`,
      );
    } catch (error) {
      this.logger.warn(
        `AI provider unavailable, returning placeholder: ${error}`,
      );
      assistantContent =
        'AI provider is not configured. Please set GEMINI_API_KEY in your environment.';
    }

    const latencyMs = Date.now() - start;

    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: assistantContent,
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        toolCallsJson: agentsUsed.length > 0 ? { agentsUsed } : undefined,
      },
    });

    return {
      conversationId,
      message: assistantMessage,
      agentsUsed,
    };
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
