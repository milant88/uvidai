import { Module } from '@nestjs/common';
import { NeighborhoodController } from './neighborhood.controller';
import { NeighborhoodService } from './neighborhood.service';

@Module({
  controllers: [NeighborhoodController],
  providers: [NeighborhoodService],
  exports: [NeighborhoodService],
})
export class NeighborhoodModule {}
