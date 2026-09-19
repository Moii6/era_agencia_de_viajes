import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForClient(tenantId: string, clientId: string) {
    await this.assertClientBelongsToTenant(tenantId, clientId);

    return this.prisma.interaction.findMany({
      where: { tenantId, clientId },
      orderBy: { occurredAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async create(
    tenantId: string,
    clientId: string,
    userId: string,
    dto: CreateInteractionDto,
  ) {
    await this.assertClientBelongsToTenant(tenantId, clientId);

    return this.prisma.interaction.create({
      data: {
        tenantId,
        clientId,
        userId,
        type: dto.type,
        content: dto.content,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });
  }

  private async assertClientBelongsToTenant(
    tenantId: string,
    clientId: string,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }
}
