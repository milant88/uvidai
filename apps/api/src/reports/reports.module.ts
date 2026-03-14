import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AirQualityModule } from '../air-quality/air-quality.module';
import { LocationModule } from '../location/location.module';
import { NeighborhoodModule } from '../neighborhood/neighborhood.module';
import { PriceModule } from '../price/price.module';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [
    AirQualityModule,
    LocationModule,
    NeighborhoodModule,
    PriceModule,
    TransportModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
