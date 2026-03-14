import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatInputDto } from './dto/chat-input.dto';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

@ApiTags('Chat')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message and get an AI response' })
  @ApiCreatedResponse({ description: 'AI response with conversation ID' })
  async chat(@Body() dto: ChatInputDto) {
    const result = await this.chatService.chat(dto, TEMP_USER_ID);
    return { success: true, data: result };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  @ApiOkResponse({ description: 'Paginated conversation list' })
  async listConversations() {
    const conversations = await this.chatService.listConversations(TEMP_USER_ID);
    return { success: true, data: conversations };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with all messages' })
  @ApiOkResponse({ description: 'Conversation with messages' })
  async getConversation(@Param('id', ParseUUIDPipe) id: string) {
    const conversation = await this.chatService.getConversation(id, TEMP_USER_ID);
    return { success: true, data: conversation };
  }
}
