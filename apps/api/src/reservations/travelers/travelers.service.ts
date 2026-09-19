import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@erp/db';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationsService } from '../reservations.service';
import { AssignSeatDto } from './dto/assign-seat.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';

@Injectable()
export class TravelersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async findAllForReservation(tenantId: string, reservationId: string) {
    await this.reservationsService.findRaw(tenantId, reservationId);

    return this.prisma.traveler.findMany({
      where: { reservationId },
      include: {
        seatAssignment: {
          include: { bus: { select: { id: true, label: true } } },
        },
      },
    });
  }

  async create(
    tenantId: string,
    reservationId: string,
    dto: CreateTravelerDto,
  ) {
    const reservation = await this.reservationsService.findRaw(
      tenantId,
      reservationId,
    );

    const occupancy = await this.prisma.quoteOccupancy.findFirst({
      where: { id: dto.quoteOccupancyId, quoteId: reservation.quoteId },
    });
    if (!occupancy) {
      throw new BadRequestException(
        'quoteOccupancyId no pertenece a la cotización de esta reserva',
      );
    }

    const currentCount = await this.prisma.traveler.count({
      where: { quoteOccupancyId: dto.quoteOccupancyId },
    });
    if (currentCount >= occupancy.adults + occupancy.minors) {
      throw new BadRequestException(
        'Ya se registraron todos los viajeros de este grupo de ocupación',
      );
    }

    await this.assertHolderRules(
      reservationId,
      dto.isHolder ?? false,
      dto.phone,
    );

    return this.prisma.traveler.create({
      data: {
        reservationId,
        quoteOccupancyId: dto.quoteOccupancyId,
        fullName: dto.fullName.trim(),
        age: dto.age,
        phone: dto.phone,
        type: dto.type,
        isHolder: dto.isHolder ?? false,
        documentId: dto.documentId,
        notes: dto.notes,
      },
    });
  }

  async update(
    tenantId: string,
    reservationId: string,
    travelerId: string,
    dto: UpdateTravelerDto,
  ) {
    await this.reservationsService.findRaw(tenantId, reservationId);
    const traveler = await this.findOne(reservationId, travelerId);

    if (dto.isHolder) {
      await this.assertHolderRules(
        reservationId,
        true,
        dto.phone ?? traveler.phone ?? undefined,
        travelerId,
      );
    }

    return this.prisma.traveler.update({
      where: { id: travelerId },
      data: { ...dto, fullName: dto.fullName?.trim() },
    });
  }

  async remove(tenantId: string, reservationId: string, travelerId: string) {
    await this.reservationsService.findRaw(tenantId, reservationId);
    await this.findOne(reservationId, travelerId);

    return this.prisma.traveler.delete({ where: { id: travelerId } });
  }

  async assignSeat(
    tenantId: string,
    reservationId: string,
    travelerId: string,
    dto: AssignSeatDto,
  ) {
    const reservation = await this.reservationsService.findRaw(
      tenantId,
      reservationId,
    );
    await this.findOne(reservationId, travelerId);

    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: reservation.quoteId },
    });
    const bus = await this.prisma.bus.findFirst({
      where: { id: dto.busId, tripId: quote.tripId },
    });
    if (!bus) {
      throw new BadRequestException(
        'busId no pertenece al viaje de esta reserva',
      );
    }

    try {
      return await this.prisma.seatAssignment.upsert({
        where: { travelerId },
        create: {
          tripId: quote.tripId,
          busId: dto.busId,
          seatNumber: dto.seatNumber,
          travelerId,
        },
        update: { busId: dto.busId, seatNumber: dto.seatNumber },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ese asiento ya está ocupado en este autobús',
        );
      }
      throw error;
    }
  }

  async unassignSeat(
    tenantId: string,
    reservationId: string,
    travelerId: string,
  ) {
    await this.reservationsService.findRaw(tenantId, reservationId);
    await this.findOne(reservationId, travelerId);

    await this.prisma.seatAssignment.deleteMany({ where: { travelerId } });
  }

  private async assertHolderRules(
    reservationId: string,
    isHolder: boolean,
    phone: string | undefined,
    excludeTravelerId?: string,
  ) {
    if (!isHolder) return;

    if (!phone) {
      throw new BadRequestException(
        'phone es requerido para el titular de la reserva',
      );
    }

    const existingHolder = await this.prisma.traveler.findFirst({
      where: {
        reservationId,
        isHolder: true,
        id: excludeTravelerId ? { not: excludeTravelerId } : undefined,
      },
    });
    if (existingHolder) {
      throw new BadRequestException('Ya existe un titular para esta reserva');
    }
  }

  private async findOne(reservationId: string, travelerId: string) {
    const traveler = await this.prisma.traveler.findFirst({
      where: { id: travelerId, reservationId },
    });
    if (!traveler) {
      throw new NotFoundException('Viajero no encontrado');
    }
    return traveler;
  }
}
