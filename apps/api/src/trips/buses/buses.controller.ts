import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Controller('trips/:tripId/buses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.busesService.findAllForTrip(user.tenantId, tripId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateBusDto,
  ) {
    return this.busesService.create(user.tenantId, tripId, dto);
  }

  @Patch(':busId')
  @Roles('OWNER', 'ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('busId') busId: string,
    @Body() dto: UpdateBusDto,
  ) {
    return this.busesService.update(user.tenantId, tripId, busId, dto);
  }

  @Delete(':busId')
  @Roles('OWNER', 'ADMIN')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('busId') busId: string,
  ) {
    return this.busesService.remove(user.tenantId, tripId, busId);
  }
}
