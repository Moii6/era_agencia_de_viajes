import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationsService } from '../reservations.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async findAllForReservation(tenantId: string, reservationId: string) {
    await this.reservationsService.findRaw(tenantId, reservationId);

    return this.prisma.deposit.findMany({
      where: { reservationId },
      orderBy: { date: 'asc' },
    });
  }

  async create(
    tenantId: string,
    reservationId: string,
    userId: string,
    dto: CreateDepositDto,
  ) {
    const reservation = await this.reservationsService.findRaw(
      tenantId,
      reservationId,
    );

    if (dto.isInitialDeposit) {
      const existingInitial = await this.prisma.deposit.findFirst({
        where: { reservationId, isInitialDeposit: true },
      });
      if (existingInitial) {
        throw new BadRequestException(
          'Esta reserva ya tiene registrado un anticipo inicial',
        );
      }

      const quote = await this.prisma.quote.findUniqueOrThrow({
        where: { id: reservation.quoteId },
        include: { trip: { select: { minimumDepositAmount: true } } },
      });
      const minimum = Number(quote.trip.minimumDepositAmount);
      if (dto.amount < minimum) {
        throw new BadRequestException(
          `El anticipo inicial debe ser al menos ${minimum} ${quote.currency}`,
        );
      }
    }

    const deposit = await this.prisma.deposit.create({
      data: {
        reservationId,
        amount: dto.amount,
        date: new Date(dto.date),
        isInitialDeposit: dto.isInitialDeposit ?? false,
        note: dto.note,
        createdByUserId: userId,
      },
    });

    if (dto.isInitialDeposit) {
      await this.reservationsService.confirmIfPendingDeposit(reservationId);
    }

    return deposit;
  }
}
