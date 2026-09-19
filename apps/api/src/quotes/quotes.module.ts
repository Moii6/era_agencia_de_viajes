import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OccupancyActivitiesController } from './occupancies/activities/occupancy-activities.controller';
import { OccupancyActivitiesService } from './occupancies/activities/occupancy-activities.service';
import { OccupanciesController } from './occupancies/occupancies.controller';
import { OccupanciesService } from './occupancies/occupancies.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    QuotesController,
    OccupanciesController,
    OccupancyActivitiesController,
  ],
  providers: [QuotesService, OccupanciesService, OccupancyActivitiesService],
  exports: [QuotesService],
})
export class QuotesModule {}
