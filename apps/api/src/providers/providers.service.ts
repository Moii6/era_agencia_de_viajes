import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { QueryProvidersDto } from './dto/query-providers.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryProvidersDto) {
    return this.prisma.provider.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return provider;
  }

  async create(tenantId: string, dto: CreateProviderDto) {
    return this.prisma.provider.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        type: dto.type,
        address: dto.address,
        contactInfo: dto.contactInfo,
        notes: dto.notes,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProviderDto) {
    await this.findById(tenantId, id);

    return this.prisma.provider.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);

    return this.prisma.provider.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
