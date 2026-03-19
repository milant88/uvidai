import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateDatasetDto {
  @ApiProperty({ description: 'Dataset name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Dataset description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Model provider (e.g. openai, anthropic, google)',
  })
  @IsString()
  @IsOptional()
  modelProvider?: string;
}
