import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'GUIDE')
  async getCurrentTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantService.findById(user.tenantId);
  }

  // ADMIN can manage users but not the agency's own profile — only OWNER
  // can edit representativeName/address/contacts/notes.
  @Patch('me')
  @Roles('OWNER')
  async updateCurrentTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(user.tenantId, dto);
  }
}
