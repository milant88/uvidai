import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional, IsString, IsArray } from 'class-validator';

export enum FeedbackSentimentDto {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
}

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Message ID to provide feedback on' })
  @IsUUID()
  messageId!: string;

  @ApiProperty({ description: 'Conversation ID' })
  @IsUUID()
  conversationId!: string;

  @ApiProperty({ enum: FeedbackSentimentDto, description: 'Feedback sentiment' })
  @IsEnum(FeedbackSentimentDto)
  sentiment!: FeedbackSentimentDto;

  @ApiPropertyOptional({ description: 'Optional comment' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Feedback categories', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];
}

export class FeedbackQueryDto {
  @ApiProperty({ description: 'Conversation ID to filter feedback' })
  @IsUUID()
  conversationId!: string;
}
