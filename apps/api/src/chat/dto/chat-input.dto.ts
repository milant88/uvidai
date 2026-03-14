import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatLocationDto {
  @ApiPropertyOptional({ example: 'Knez Mihailova, Beograd' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 44.8176 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ example: 20.4569 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  @Type(() => Number)
  lng?: number;
}

export class ChatInputDto {
  @ApiProperty({ description: 'User message', example: 'Kakav je kvalitet vazduha na Vračaru?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ description: 'Existing conversation ID' })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Location context' })
  @ValidateNested()
  @Type(() => ChatLocationDto)
  @IsOptional()
  location?: ChatLocationDto;

  @ApiPropertyOptional({ description: 'Response language', default: 'sr-Latn' })
  @IsString()
  @IsOptional()
  locale?: string;
}
