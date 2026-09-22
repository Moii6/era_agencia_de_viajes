import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { UsersService } from '../users/users.service';
import { TenantService } from './tenant.service';

// Deliberately unguarded — this is the one place in the API meant to be hit
// by someone who isn't logged in yet: they're asking to join an agency.
@Controller('tenants')
export class PublicRegistrationController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':slug/public')
  async getPublicTenant(@Param('slug') slug: string) {
    return this.tenantService.findBySlugPublic(slug);
  }

  @Post(':slug/register')
  async register(@Param('slug') slug: string, @Body() dto: RegisterUserDto) {
    return this.usersService.registerPublic(slug, dto);
  }
}
