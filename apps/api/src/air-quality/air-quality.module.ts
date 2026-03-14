import { Module } from '@nestjs/common';
import { AirQualityController } from './air-quality.controller';
import { AirQualityService } from './air-quality.service';

@Module({
  controllers: [AirQualityController],
  providers: [AirQualityService],
  exports: [AirQualityService],
})
export class AirQualityModule {}
