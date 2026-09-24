import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@erp/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

// CONFIRMED is deliberately unreachable here — see UpdateReservationDto.
const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING_DEPOSIT: ['CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryReservationsDto) {
    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        ...(query.status ? { status: query.status } : {}),
        quote: {
          ...(query.clientId ? { clientId: query.clientId } : {}),
          ...(query.tripId ? { tripId: query.tripId } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        quote: {
          select: {
            id: true,
            total: true,
            client: { select: { id: true, name: true } },
            trip: { select: { id: true, name: true, departureDate: true } },
          },
        },
        _count: { select: { travelers: true, deposits: true } },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    await this.findRaw(tenantId, id);

    const reservation = await this.prisma.reservation.findFirst({
      where: { id },
      include: {
        quote: {
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true },
            },
            trip: {
              select: {
                id: true,
                name: true,
                departureDate: true,
                minimumDepositAmount: true,
              },
            },
          },
        },
        travelers: {
          include: {
            seatAssignment: {
              include: { bus: { select: { id: true, label: true } } },
            },
          },
        },
        deposits: { orderBy: { date: 'asc' } },
      },
    });

    const depositsSum = reservation!.deposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    const balance = Number(reservation!.quote.total) - depositsSum;

    return { ...reservation, depositsSum, balance };
  }

  /** Recomputes { depositsSum, balance } without pulling in travelers/client/trip like findById does. */
  private async computeBalance(reservationId: string) {
    const reservation = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { deposits: true, quote: { select: { total: true } } },
    });
    const depositsSum = reservation.deposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    return { depositsSum, balance: Number(reservation.quote.total) - depositsSum };
  }

  async create(tenantId: string, dto: CreateReservationDto) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: dto.quoteId, tenantId },
    });
    if (!quote) {
      throw new BadRequestException('quoteId no pertenece a este tenant');
    }
    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'La cotización debe estar en estado ACCEPTED para generar una reserva',
      );
    }

    const existing = await this.prisma.reservation.findUnique({
      where: { quoteId: dto.quoteId },
    });
    if (existing) {
      throw new ConflictException('Esta cotización ya tiene una reserva');
    }

    return this.prisma.reservation.create({
      data: {
        tenantId,
        quoteId: dto.quoteId,
        touristAccessToken: randomBytes(24).toString('hex'),
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateReservationDto) {
    const reservation = await this.findRaw(tenantId, id);

    if (!ALLOWED_TRANSITIONS[reservation.status].includes(dto.status)) {
      throw new BadRequestException(
        `No se puede pasar de ${reservation.status} a ${dto.status}`,
      );
    }

    // A reservation only completes once nothing is owed — this is normally
    // reached automatically (see syncStatusAfterDeposit), but this guard
    // also covers a manual PATCH straight to COMPLETED.
    if (dto.status === 'COMPLETED') {
      const { balance } = await this.computeBalance(id);
      if (balance > 0) {
        throw new BadRequestException(
          `No se puede completar la reserva con saldo pendiente (${balance})`,
        );
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /**
   * Called by DepositsService after registering any deposit. An initial
   * deposit moves PENDING_DEPOSIT → CONFIRMED (as before); then, regardless
   * of which deposit just landed, a CONFIRMED reservation whose balance has
   * reached zero (or gone negative, on overpayment) auto-completes — the
   * agency shouldn't have to remember to flip the status by hand once
   * everything's been paid.
   */
  async syncStatusAfterDeposit(reservationId: string, isInitialDeposit: boolean) {
    let reservation = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });

    if (isInitialDeposit && reservation.status === 'PENDING_DEPOSIT') {
      reservation = await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' },
      });
    }

    if (reservation.status === 'CONFIRMED') {
      const { balance } = await this.computeBalance(reservationId);
      if (balance <= 0) {
        await this.prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'COMPLETED' },
        });
      }
    }
  }

  async findRaw(tenantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reservation;
  }
}
