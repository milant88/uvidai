import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto/create-feedback.dto';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit feedback on a message' })
  @ApiCreatedResponse({ description: 'Feedback created' })
  async create(@Body() dto: CreateFeedbackDto) {
    const feedback = await this.feedbackService.create(dto, TEMP_USER_ID);
    return { success: true, data: feedback };
  }

  @Get()
  @ApiOperation({ summary: 'Get feedback for a conversation (admin)' })
  @ApiOkResponse({ description: 'List of feedback entries' })
  async findByConversation(@Query() query: FeedbackQueryDto) {
    const feedbackList = await this.feedbackService.findByConversation(
      query.conversationId,
    );
    return { success: true, data: feedbackList };
  }
}
