import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DepositsController } from './deposits/deposits.controller';
import { DepositsService } from './deposits/deposits.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { TravelersController } from './travelers/travelers.controller';
import { TravelersService } from './travelers/travelers.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ReservationsController,
    TravelersController,
    DepositsController,
  ],
  providers: [ReservationsService, TravelersService, DepositsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
