import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { PoiModule } from '../poi/poi.module';
import { AirQualityModule } from '../air-quality/air-quality.module';
import { PriceModule } from '../price/price.module';
import { LegalModule } from '../legal/legal.module';
import { ChatModule } from '../chat/chat.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { HealthModule } from '../health/health.module';
import { AdminModule } from '../admin/admin.module';
import { TransportModule } from '../transport/transport.module';
import { BusinessModule } from '../business/business.module';
import { NeighborhoodModule } from '../neighborhood/neighborhood.module';
import { ReportsModule } from '../reports/reports.module';
import { FineTuneModule } from '../fine-tune/fine-tune.module';
import { AbTestingModule } from '../ab-testing/ab-testing.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    LocationModule,
    PoiModule,
    AirQualityModule,
    PriceModule,
    LegalModule,
    ChatModule,
    FeedbackModule,
    HealthModule,
    AdminModule,
    TransportModule,
    BusinessModule,
    NeighborhoodModule,
    ReportsModule,
    FineTuneModule,
    AbTestingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
