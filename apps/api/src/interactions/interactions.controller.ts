import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionsService } from './interactions.service';

@Controller('clients/:clientId/interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    return this.interactionsService.findAllForClient(user.tenantId, clientId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: CreateInteractionDto,
  ) {
    return this.interactionsService.create(
      user.tenantId,
      clientId,
      user.userId,
      dto,
    );
  }
}
