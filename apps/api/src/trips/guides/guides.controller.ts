import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { CreateTripGuideDto } from './dto/create-trip-guide.dto';
import { GuidesService } from './guides.service';

@Controller('trips/:tripId/guides')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT', 'GUIDE')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.guidesService.findAllForTrip(user.tenantId, tripId, {
      id: user.userId,
      role: user.role,
    });
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripGuideDto,
  ) {
    return this.guidesService.create(user.tenantId, tripId, dto);
  }

  @Delete(':guideId')
  @Roles('OWNER', 'ADMIN')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('guideId') guideId: string,
  ) {
    return this.guidesService.remove(user.tenantId, tripId, guideId);
  }
}
