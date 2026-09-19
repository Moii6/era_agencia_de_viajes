import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryClientsDto) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query.stage ? { stage: query.stage } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  async create(tenantId: string, dto: CreateClientDto) {
    await this.assertOwnerBelongsToTenant(tenantId, dto.ownerUserId);

    return this.prisma.client.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        stage: dto.stage,
        source: dto.source,
        notes: dto.notes,
        ownerUserId: dto.ownerUserId,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findById(tenantId, id);
    await this.assertOwnerBelongsToTenant(tenantId, dto.ownerUserId);

    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        email: dto.email?.toLowerCase(),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwnerBelongsToTenant(
    tenantId: string,
    ownerUserId?: string,
  ) {
    if (!ownerUserId) return;

    const owner = await this.prisma.user.findFirst({
      where: { id: ownerUserId, tenantId },
    });
    if (!owner) {
      throw new BadRequestException('ownerUserId no pertenece a este tenant');
    }
  }
}
