import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminRatingDto {
  @ApiProperty({ description: 'Message ID to rate' })
  @IsUUID()
  messageId!: string;

  @ApiProperty({ description: 'Accuracy score 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  accuracy!: number;

  @ApiProperty({ description: 'Completeness score 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  completeness!: number;

  @ApiProperty({ description: 'Relevance score 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  relevance!: number;

  @ApiProperty({ description: 'Tone score 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  tone!: number;

  @ApiPropertyOptional({ description: 'Ideal response text for training' })
  @IsString()
  @IsOptional()
  idealResponseText?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
