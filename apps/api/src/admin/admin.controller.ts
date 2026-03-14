import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminRatingDto } from './dto/admin-rating.dto';
import {
  AdminConversationsQueryDto,
  AdminRatingsQueryDto,
  AdminFeedbackQueryDto,
  AdminAnalyticsQueryDto,
} from './dto/admin-query.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiOkResponse({ description: 'Dashboard statistics' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return { success: true, data: stats };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated conversation list' })
  async listConversations(@Query() query: AdminConversationsQueryDto) {
    const result = await this.adminService.listConversations(query);
    return { success: true, ...result };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get single conversation with all messages' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiOkResponse({ description: 'Conversation with messages' })
  async getConversation(@Param('id', ParseUUIDPipe) id: string) {
    const conversation = await this.adminService.getConversation(id);
    return { success: true, data: conversation };
  }

  @Post('ratings')
  @ApiOperation({ summary: 'Submit admin rating for a message' })
  @ApiCreatedResponse({ description: 'Rating created' })
  async submitRating(@Body() dto: AdminRatingDto) {
    const rating = await this.adminService.submitRating(dto);
    return { success: true, data: rating };
  }

  @Get('ratings')
  @ApiOperation({ summary: 'List admin ratings with pagination' })
  @ApiOkResponse({ description: 'Paginated ratings list' })
  async listRatings(@Query() query: AdminRatingsQueryDto) {
    const result = await this.adminService.listRatings(query);
    return { success: true, ...result };
  }

  @Get('ratings/unrated')
  @ApiOperation({ summary: 'Get next unrated messages for rating queue' })
  @ApiOkResponse({ description: 'Unrated assistant messages' })
  async getUnrated(@Query('limit') limit?: number) {
    const result = await this.adminService.getUnratedMessages(
      limit ? Number(limit) : 20,
    );
    return { success: true, ...result };
  }

  @Get('feedback')
  @ApiOperation({ summary: 'List user feedback with pagination and filtering' })
  @ApiOkResponse({ description: 'Paginated feedback list' })
  async listFeedback(@Query() query: AdminFeedbackQueryDto) {
    const result = await this.adminService.listFeedback(query);
    return { success: true, ...result };
  }

  @Get('analytics/usage')
  @ApiOperation({ summary: 'Usage analytics - query volume by time, module breakdown' })
  @ApiOkResponse({ description: 'Usage analytics data' })
  async getUsageAnalytics(@Query() query: AdminAnalyticsQueryDto) {
    const data = await this.adminService.getUsageAnalytics(query);
    return { success: true, data };
  }

  @Get('analytics/ai-performance')
  @ApiOperation({ summary: 'AI performance - tokens, cost, latency percentiles' })
  @ApiOkResponse({ description: 'AI performance metrics' })
  async getAiPerformance(@Query() query: AdminAnalyticsQueryDto) {
    const data = await this.adminService.getAiPerformance(query);
    return { success: true, data };
  }
}
