import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceEstimateQueryDto {
  @ApiProperty({ description: 'Latitude', example: 44.8176 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat!: number;

  @ApiProperty({ description: 'Longitude', example: 20.4569 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng!: number;

  @ApiPropertyOptional({
    description: 'Property type',
    enum: ['apartment', 'house', 'land', 'commercial'],
    default: 'apartment',
  })
  @IsOptional()
  @IsEnum(['apartment', 'house', 'land', 'commercial'])
  type?: 'apartment' | 'house' | 'land' | 'commercial';

  @ApiPropertyOptional({ description: 'Area in m² for total price estimate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  area?: number;
}
