import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TransportStopsQueryDto {
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

export class TransportCommuteQueryDto {
  @ApiProperty({ description: 'Origin latitude', example: 44.8176 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  fromLat!: number;

  @ApiProperty({ description: 'Origin longitude', example: 20.4569 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  fromLng!: number;

  @ApiProperty({ description: 'Destination latitude', example: 44.8125 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  toLat!: number;

  @ApiProperty({ description: 'Destination longitude', example: 20.4204 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  toLng!: number;
}
