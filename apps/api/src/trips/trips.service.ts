import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryTripsDto) {
    return this.prisma.trip.findMany({
      where: { tenantId, ...(query.status ? { status: query.status } : {}) },
      orderBy: { departureDate: 'asc' },
      include: {
        hotelProvider: { select: { id: true, name: true } },
        _count: {
          select: {
            buses: true,
            roomTypes: true,
            activities: true,
            quotes: true,
          },
        },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, tenantId },
      include: {
        hotelProvider: { select: { id: true, name: true } },
        buses: true,
        roomTypes: true,
        activities: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    return trip;
  }

  async create(tenantId: string, dto: CreateTripDto) {
    await this.assertProviderBelongsToTenant(tenantId, dto.hotelProviderId);

    return this.prisma.trip.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        destination: dto.destination,
        departureDate: new Date(dto.departureDate),
        departureTime: dto.departureTime,
        departurePoint: dto.departurePoint,
        returnDate: new Date(dto.returnDate),
        returnTime: dto.returnTime,
        returnPoint: dto.returnPoint,
        transportIncluded: dto.transportIncluded ?? true,
        transportNotes: dto.transportNotes,
        lodgingIncluded: dto.lodgingIncluded ?? true,
        hotelProviderId: dto.hotelProviderId,
        capacity: dto.capacity,
        minimumDepositAmount: dto.minimumDepositAmount,
        notes: dto.notes,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTripDto) {
    await this.findById(tenantId, id);
    await this.assertProviderBelongsToTenant(tenantId, dto.hotelProviderId);

    return this.prisma.trip.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        departureDate: dto.departureDate
          ? new Date(dto.departureDate)
          : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
      },
    });
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
      throw new BadRequestException(
        'hotelProviderId no pertenece a este tenant',
      );
    }
  }
}
