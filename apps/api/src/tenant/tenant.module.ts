import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { PublicRegistrationController } from './public-registration.controller';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [TenantController, PublicRegistrationController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
