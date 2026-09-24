import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@erp/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

type Requester = { id: string; role: UserRole };

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTrip(tenantId: string, tripId: string, requester?: Requester) {
    await this.assertTripBelongsToTenant(tenantId, tripId, requester);

    return this.prisma.roomType.findMany({
      where: { tripId },
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, tripId: string, dto: CreateRoomTypeDto) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    return this.prisma.roomType.create({
      data: {
        tripId,
        name: dto.name.trim(),
        characteristics: dto.characteristics,
        maxOccupancy: dto.maxOccupancy,
        quantityAvailable: dto.quantityAvailable,
      },
    });
  }

  async update(
    tenantId: string,
    tripId: string,
    roomTypeId: string,
    dto: UpdateRoomTypeDto,
  ) {
    await this.findOne(tenantId, tripId, roomTypeId);

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: { ...dto, name: dto.name?.trim() },
    });
  }

  async remove(tenantId: string, tripId: string, roomTypeId: string) {
    await this.findOne(tenantId, tripId, roomTypeId);

    return this.prisma.roomType.delete({ where: { id: roomTypeId } });
  }

  private async findOne(tenantId: string, tripId: string, roomTypeId: string) {
    await this.assertTripBelongsToTenant(tenantId, tripId);

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: roomTypeId, tripId },
    });
    if (!roomType) {
      throw new NotFoundException('Tipo de habitación no encontrado');
    }
    return roomType;
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
