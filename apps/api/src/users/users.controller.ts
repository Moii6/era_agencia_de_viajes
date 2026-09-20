import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.tenantId);
  }

  @Get('me')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'GUIDE')
  async findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.tenantId, user.userId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.create(user.tenantId, user.userId, dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(user.tenantId, user.userId, id, dto);
  }

  // Approving/rejecting is OWNER-only by design — that's the whole point of
  // the two-owner check, an ADMIN can propose changes but can't sign off on them.
  @Post(':id/approve')
  @Roles('OWNER')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.approve(user.tenantId, user.userId, id);
  }

  @Post(':id/reject')
  @Roles('OWNER')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.reject(user.tenantId, user.userId, id);
  }
}
