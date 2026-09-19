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
import { CreateOccupancyDto } from './dto/create-occupancy.dto';
import { UpdateOccupancyDto } from './dto/update-occupancy.dto';
import { OccupanciesService } from './occupancies.service';

@Controller('quotes/:quoteId/occupancies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class OccupanciesController {
  constructor(private readonly occupanciesService: OccupanciesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
  ) {
    return this.occupanciesService.findAllForQuote(user.tenantId, quoteId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Body() dto: CreateOccupancyDto,
  ) {
    return this.occupanciesService.create(user.tenantId, quoteId, dto);
  }

  @Patch(':occupancyId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
    @Body() dto: UpdateOccupancyDto,
  ) {
    return this.occupanciesService.update(
      user.tenantId,
      quoteId,
      occupancyId,
      dto,
    );
  }

  @Delete(':occupancyId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('quoteId') quoteId: string,
    @Param('occupancyId') occupancyId: string,
  ) {
    return this.occupanciesService.remove(user.tenantId, quoteId, occupancyId);
  }
}
