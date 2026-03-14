import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAbTestDto {
  @ApiProperty({ description: 'A/B test name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Prompt text for variant A' })
  @IsString()
  promptVariantA!: string;

  @ApiProperty({ description: 'Prompt text for variant B' })
  @IsString()
  promptVariantB!: string;

  @ApiPropertyOptional({
    description: 'Traffic split percentage for A (0-100), B gets remainder',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  trafficSplit?: number = 50;

  @ApiPropertyOptional({
    description: 'Evaluation criteria (e.g. user_rating, admin_rating)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evaluationCriteria?: string[];
}
