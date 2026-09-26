import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@erp/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripGuideDto } from './dto/create-trip-guide.dto';

type Requester = { id: string; role: UserRole };

const USER_SELECT = { id: true, name: true, email: true } as const;

@Injectable()
export class GuidesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTrip(tenantId: string, tripId: string, requester?: Requester) {
    await this.assertTripBelongsToTenant(tenantId, tripId, requester);

    return this.prisma.tripGuide.findMany({
      where: { tripId },
      include: { user: { select: USER_SELECT } },
      orderBy: [{ isLead: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(tenantId: string, tripId: string, dto: CreateTripGuideDto) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });
    if (!user) {
      throw new BadRequestException('userId no pertenece a este tenant');
    }
    if (user.role !== 'GUIDE') {
      throw new BadRequestException(
        'Solo un usuario con rol Guía puede asignarse como guía del viaje',
      );
    }

    // At most one lead guide per trip — reject instead of silently
    // demoting whoever already had the badge.
    if (dto.isLead) {
      const existingLead = await this.prisma.tripGuide.findFirst({
        where: { tripId, isLead: true },
      });
      if (existingLead) {
        throw new BadRequestException(
          'Ya hay un guía líder para este viaje — quítalo antes de asignar otro',
        );
      }
    }

    const existing = await this.prisma.tripGuide.findUnique({
      where: { tripId_userId: { tripId, userId: dto.userId } },
    });
    if (existing) {
      throw new ConflictException('Este usuario ya está asignado como guía de este viaje');
    }

    return this.prisma.tripGuide.create({
      data: { tripId, userId: dto.userId, isLead: dto.isLead ?? false },
      include: { user: { select: USER_SELECT } },
    });
  }

  async remove(tenantId: string, tripId: string, guideId: string) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    const guide = await this.prisma.tripGuide.findFirst({
      where: { id: guideId, tripId },
    });
    if (!guide) {
      throw new NotFoundException('Guía no encontrado en este viaje');
    }

    // Cascade deletes the guide's seat assignment, if any — see the
    // 2026-09-26 migration.
    return this.prisma.tripGuide.delete({ where: { id: guideId } });
  }

  private async assertTripBelongsToTenant(
    tenantId: string,
    tripId: string,
    requester?: Requester,
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        ...(requester?.role === 'GUIDE' ? { guides: { some: { userId: requester.id } } } : {}),
      },
      select: { id: true },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
  }
}
