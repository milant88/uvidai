import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class NeighborhoodScoreQueryDto {
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
    description: 'Search radius in metres',
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @Type(() => Number)
  radius?: number;
}
