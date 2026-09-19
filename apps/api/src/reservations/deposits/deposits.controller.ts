import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

// No PATCH/DELETE by design: a deposit is a ledger entry reflecting money
// already received outside the app — it doesn't get edited after the fact.
@Controller('reservations/:reservationId/deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'AGENT')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
  ) {
    return this.depositsService.findAllForReservation(
      user.tenantId,
      reservationId,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
    @Body() dto: CreateDepositDto,
  ) {
    return this.depositsService.create(
      user.tenantId,
      reservationId,
      user.userId,
      dto,
    );
  }
}
