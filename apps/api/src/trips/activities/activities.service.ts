import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTrip(tenantId: string, tripId: string) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    return this.prisma.activity.findMany({
      where: { tripId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(tenantId: string, tripId: string, dto: CreateActivityDto) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    if (dto.hasExtraCost && dto.price == null) {
      throw new BadRequestException(
        'price es requerido cuando hasExtraCost es true',
      );
    }

    return this.prisma.activity.create({
      data: {
        tripId,
        name: dto.name.trim(),
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        hasExtraCost: dto.hasExtraCost,
        price: dto.hasExtraCost ? dto.price : null,
        ...(dto.currency ? { currency: dto.currency } : {}),
      },
    });
  }

  async update(
    tenantId: string,
    tripId: string,
    activityId: string,
    dto: UpdateActivityDto,
  ) {
    const activity = await this.findOne(tenantId, tripId, activityId);

    const hasExtraCost = dto.hasExtraCost ?? activity.hasExtraCost;
    const price = hasExtraCost ? (dto.price ?? Number(activity.price)) : null;

    if (hasExtraCost && price == null) {
      throw new BadRequestException(
        'price es requerido cuando hasExtraCost es true',
      );
    }

    return this.prisma.activity.update({
      where: { id: activityId },
      data: {
        ...dto,
        name: dto.name?.trim(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        hasExtraCost,
        price,
      },
    });
  }

  async remove(tenantId: string, tripId: string, activityId: string) {
    await this.findOne(tenantId, tripId, activityId);

    return this.prisma.activity.delete({ where: { id: activityId } });
  }

  private async findOne(tenantId: string, tripId: string, activityId: string) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, tripId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return activity;
  }

  private async assertTripBelongsToTenant(tenantId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
      select: { id: true },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
  }
}
