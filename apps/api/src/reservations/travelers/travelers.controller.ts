import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { AssignSeatDto } from './dto/assign-seat.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';
import { TravelersService } from './travelers.service';

@Controller('reservations/:reservationId/travelers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class TravelersController {
  constructor(private readonly travelersService: TravelersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
  ) {
    return this.travelersService.findAllForReservation(
      user.tenantId,
      reservationId,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Body() dto: CreateTravelerDto,
  ) {
    return this.travelersService.create(user.tenantId, reservationId, dto);
  }

  @Patch(':travelerId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Param('travelerId') travelerId: string,
    @Body() dto: UpdateTravelerDto,
  ) {
    return this.travelersService.update(
      user.tenantId,
      reservationId,
      travelerId,
      dto,
    );
  }

  @Delete(':travelerId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Param('travelerId') travelerId: string,
  ) {
    return this.travelersService.remove(
      user.tenantId,
      reservationId,
      travelerId,
    );
  }

  @Put(':travelerId/seat')
  assignSeat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Param('travelerId') travelerId: string,
    @Body() dto: AssignSeatDto,
  ) {
    return this.travelersService.assignSeat(
      user.tenantId,
      reservationId,
      travelerId,
      dto,
    );
  }

  @Delete(':travelerId/seat')
  unassignSeat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Param('travelerId') travelerId: string,
  ) {
    return this.travelersService.unassignSeat(
      user.tenantId,
      reservationId,
      travelerId,
    );
  }
}
