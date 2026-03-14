import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListingSearchQueryDto {
  @ApiProperty({ description: 'City slug (e.g. beograd, novi-sad)', example: 'beograd' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({
    description: 'Property type',
    enum: ['apartment', 'house', 'land', 'commercial'],
  })
  @IsOptional()
  @IsEnum(['apartment', 'house', 'land', 'commercial'])
  type?: 'apartment' | 'house' | 'land' | 'commercial';

  @ApiPropertyOptional({
    description: 'Transaction type',
    enum: ['sale', 'rent'],
  })
  @IsOptional()
  @IsEnum(['sale', 'rent'])
  transactionType?: 'sale' | 'rent';

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Min price (EUR)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Max price (EUR)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Min area (m²)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minArea?: number;

  @ApiPropertyOptional({ description: 'Max area (m²)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxArea?: number;

  @ApiPropertyOptional({ description: 'Municipality filter' })
  @IsOptional()
  @IsString()
  municipality?: string;

  @ApiPropertyOptional({ description: 'Max results per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
