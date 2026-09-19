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
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { RoomTypesService } from './room-types.service';

@Controller('trips/:tripId/room-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.roomTypesService.findAllForTrip(user.tenantId, tripId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.roomTypesService.create(user.tenantId, tripId, dto);
  }

  @Patch(':roomTypeId')
  @Roles('OWNER', 'ADMIN')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.update(user.tenantId, tripId, roomTypeId, dto);
  }

  @Delete(':roomTypeId')
  @Roles('OWNER', 'ADMIN')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('roomTypeId') roomTypeId: string,
  ) {
    return this.roomTypesService.remove(user.tenantId, tripId, roomTypeId);
  }
}
