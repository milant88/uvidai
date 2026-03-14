import { Module } from '@nestjs/common';
import { FineTuneController } from './fine-tune.controller';
import { FineTuneService } from './fine-tune.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FineTuneController],
  providers: [FineTuneService],
})
export class FineTuneModule {}
