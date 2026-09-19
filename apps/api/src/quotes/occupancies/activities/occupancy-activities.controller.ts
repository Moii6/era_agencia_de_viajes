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
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { CreateOccupancyActivityDto } from './dto/create-occupancy-activity.dto';
import { UpdateOccupancyActivityDto } from './dto/update-occupancy-activity.dto';
import { OccupancyActivitiesService } from './occupancy-activities.service';

@Controller('quotes/:quoteId/occupancies/:occupancyId/activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class OccupancyActivitiesController {
  constructor(
    private readonly occupancyActivitiesService: OccupancyActivitiesService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
  ) {
    return this.occupancyActivitiesService.findAllForOccupancy(
      user.tenantId,
      quoteId,
      occupancyId,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
    @Body() dto: CreateOccupancyActivityDto,
  ) {
    return this.occupancyActivitiesService.create(
      user.tenantId,
      quoteId,
      occupancyId,
      dto,
    );
  }

  @Patch(':lineId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateOccupancyActivityDto,
  ) {
    return this.occupancyActivitiesService.update(
      user.tenantId,
      quoteId,
      occupancyId,
      lineId,
      dto,
    );
  }

  @Delete(':lineId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
    @Param('lineId') lineId: string,
  ) {
    return this.occupancyActivitiesService.remove(
      user.tenantId,
      quoteId,
      occupancyId,
      lineId,
    );
  }
}
