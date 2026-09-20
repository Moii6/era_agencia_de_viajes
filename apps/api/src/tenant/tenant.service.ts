import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async update(tenantId: string, dto: UpdateTenantDto) {
    await this.findRaw(tenantId);

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...dto, name: dto.name?.trim() },
    });
  }

  private async findRaw(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }
    return tenant;
  }

  async findById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            trips: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const { _count, ...tenantData } = tenant;

    return {
      ...tenantData,
      stats: {
        users: _count.users,
        clients: _count.clients,
        trips: _count.trips,
      },
    };
  }
}
