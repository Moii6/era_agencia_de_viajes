import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { BusesController } from './buses/buses.controller';
import { BusesService } from './buses/buses.service';
import { GuidesController } from './guides/guides.controller';
import { GuidesService } from './guides/guides.service';
import { RoomTypesController } from './room-types/room-types.controller';
import { RoomTypesService } from './room-types/room-types.service';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TripsController,
    BusesController,
    RoomTypesController,
    ActivitiesController,
    GuidesController,
  ],
  providers: [
    TripsService,
    BusesService,
    RoomTypesService,
    ActivitiesService,
    GuidesService,
  ],
  exports: [TripsService],
})
export class TripsModule {}
