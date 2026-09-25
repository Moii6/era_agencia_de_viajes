import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@erp/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

type Requester = { id: string; role: UserRole };

@Injectable()
export class BusesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTrip(tenantId: string, tripId: string, requester?: Requester) {
    await this.assertTripBelongsToTenant(tenantId, tripId, requester);

    return this.prisma.bus.findMany({
      where: { tripId },
      orderBy: { label: 'asc' },
      // So the frontend can offer a "pick from available seats" list, and
      // show who's already seated, without a separate endpoint — occupancy
      // is trip-wide (any reservation's traveler, or a guide), not scoped
      // to one reservation.
      include: {
        seatAssignments: {
          // Seat numbers are free-form strings, not necessarily zero-padded
          // integers ("10" would sort before "2") — sort numerically on the
          // frontend instead of relying on a DB-level string sort here.
          select: {
            seatNumber: true,
            traveler: { select: { id: true, fullName: true, isHolder: true } },
            tripGuide: {
              select: { id: true, isLead: true, user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  async create(tenantId: string, tripId: string, dto: CreateBusDto) {
    await this.assertTripBelongsToTenant(tenantId, tripId);
    await this.assertProviderBelongsToTenant(tenantId, dto.providerId);

    return this.prisma.bus.create({
      data: {
        tripId,
        label: dto.label.trim(),
        providerId: dto.providerId,
        seatCapacity: dto.seatCapacity,
        plateOrUnitNumber: dto.plateOrUnitNumber,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        driverLicense: dto.driverLicense,
        notes: dto.notes,
      },
    });
  }

  async update(
    tenantId: string,
    tripId: string,
    busId: string,
    dto: UpdateBusDto,
  ) {
    await this.findOne(tenantId, tripId, busId);
    await this.assertProviderBelongsToTenant(tenantId, dto.providerId);

    return this.prisma.bus.update({
      where: { id: busId },
      data: { ...dto, label: dto.label?.trim() },
    });
  }

  async remove(tenantId: string, tripId: string, busId: string) {
    await this.findOne(tenantId, tripId, busId);

    return this.prisma.bus.delete({ where: { id: busId } });
  }

  private async findOne(tenantId: string, tripId: string, busId: string) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    const bus = await this.prisma.bus.findFirst({
      where: { id: busId, tripId },
    });
    if (!bus) {
      throw new NotFoundException('Autobús no encontrado');
    }
    return bus;
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

  private async assertProviderBelongsToTenant(
    tenantId: string,
    providerId?: string,
  ) {
    if (!providerId) return;

    const provider = await this.prisma.provider.findFirst({
      where: { id: providerId, tenantId, deletedAt: null },
    });
    if (!provider) {
      throw new BadRequestException('providerId no pertenece a este tenant');
    }
  }
}
