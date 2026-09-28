import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CheckInLeg } from '@erp/db';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { CheckInsService } from './checkins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';

// Check-in is a day-of-trip operational action — OWNER/ADMIN for oversight
// plus GUIDE (who's actually there doing it). AGENT can look but not act,
// same as it can't touch buses/room-types/activities either.
@Controller('trips/:tripId/checkins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT', 'GUIDE')
  findRoster(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Query('leg') leg: CheckInLeg,
  ) {
    return this.checkInsService.findRoster(user.tenantId, tripId, leg, {
      id: user.userId,
      role: user.role,
    });
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'GUIDE')
  checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateCheckInDto,
  ) {
    return this.checkInsService.checkIn(user.tenantId, tripId, user.userId, dto, {
      id: user.userId,
      role: user.role,
    });
  }

  @Post('start-return')
  @Roles('OWNER', 'ADMIN', 'GUIDE')
  startReturnCheckIn(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.checkInsService.startReturnCheckIn(user.tenantId, tripId, {
      id: user.userId,
      role: user.role,
    });
  }
}
