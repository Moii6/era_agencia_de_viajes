import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CheckInLeg, UserRole } from '@erp/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';

type Requester = { id: string; role: UserRole };

const SEAT_INCLUDE = {
  traveler: { select: { id: true, fullName: true, isHolder: true } },
  tripGuide: {
    select: { id: true, isLead: true, user: { select: { id: true, name: true } } },
  },
} as const;

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  // Roster of every seat (traveler or guide) across every bus of the trip,
  // with its check-in record for the requested leg if one exists yet —
  // ordering by seatNumber is left to the frontend (it's a free-text field,
  // "10" would sort before "2" as a string).
  async findRoster(tenantId: string, tripId: string, leg: CheckInLeg, requester?: Requester) {
    await this.assertTripAccessible(tenantId, tripId, requester);

    return this.prisma.seatAssignment.findMany({
      where: { tripId },
      include: {
        ...SEAT_INCLUDE,
        bus: { select: { id: true, label: true } },
        checkIns: { where: { leg } },
      },
    });
  }

  async checkIn(
    tenantId: string,
    tripId: string,
    checkedByUserId: string,
    dto: CreateCheckInDto,
    requester?: Requester,
  ) {
    const trip = await this.assertTripAccessible(tenantId, tripId, requester);

    if (!trip.currentPhase) {
      throw new BadRequestException('El viaje todavía no está en curso');
    }
    if (dto.leg === 'RETURN' && trip.currentPhase !== 'CHECKIN_RETURN' && trip.currentPhase !== 'RETURN_TRANSFER') {
      throw new BadRequestException('Todavía no inicia el check-in de regreso para este viaje');
    }

    const seatAssignment = await this.prisma.seatAssignment.findFirst({
      where: { id: dto.seatAssignmentId, tripId },
    });
    if (!seatAssignment) {
      throw new NotFoundException('Asiento no encontrado en este viaje');
    }

    const checkIn = await this.prisma.tripCheckIn.upsert({
      where: {
        seatAssignmentId_leg: { seatAssignmentId: dto.seatAssignmentId, leg: dto.leg },
      },
      create: {
        tripId,
        seatAssignmentId: dto.seatAssignmentId,
        leg: dto.leg,
        checkedIn: dto.checkedIn ?? true,
        note: dto.note,
        checkedByUserId,
      },
      update: {
        checkedIn: dto.checkedIn ?? true,
        note: dto.note,
        checkedByUserId,
      },
      include: { seatAssignment: { include: SEAT_INCLUDE } },
    });

    await this.maybeAdvancePhase(tripId, dto.leg);

    return checkIn;
  }

  // No data signal tells us it's time to head home — a guide has to decide
  // that and start the return leg's check-in by hand.
  async startReturnCheckIn(tenantId: string, tripId: string, requester?: Requester) {
    const trip = await this.assertTripAccessible(tenantId, tripId, requester);

    if (trip.currentPhase !== 'EN_DESTINO') {
      throw new BadRequestException(
        'Solo se puede iniciar el check-in de regreso cuando el viaje está en la fase "En destino"',
      );
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { currentPhase: 'CHECKIN_RETURN', phaseCheckinReturnAt: new Date() },
    });
  }

  // Advances CHECKIN_DEPARTURE -> EN_DESTINO or CHECKIN_RETURN -> RETURN_TRANSFER
  // the moment the last seat on the trip (across every bus) gets checked in
  // for that leg — a no-show still counts, since the guide always files a
  // row for them (checkedIn: false + note), so the roster is never stuck
  // waiting on someone who simply never shows a status.
  private async maybeAdvancePhase(tripId: string, leg: CheckInLeg) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { currentPhase: true },
    });
    const expectedPhase = leg === 'DEPARTURE' ? 'CHECKIN_DEPARTURE' : 'CHECKIN_RETURN';
    if (trip?.currentPhase !== expectedPhase) {
      return;
    }

    const totalSeats = await this.prisma.seatAssignment.count({ where: { tripId } });
    if (totalSeats === 0) {
      return;
    }
    const checkedCount = await this.prisma.tripCheckIn.count({ where: { tripId, leg } });
    if (checkedCount < totalSeats) {
      return;
    }

    const nextPhase = leg === 'DEPARTURE' ? 'EN_DESTINO' : 'RETURN_TRANSFER';
    const timestampField = leg === 'DEPARTURE' ? 'phaseEnDestinoAt' : 'phaseReturnTransferAt';
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { currentPhase: nextPhase, [timestampField]: new Date() },
    });
  }

  private async assertTripAccessible(tenantId: string, tripId: string, requester?: Requester) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
        ...(requester?.role === 'GUIDE' ? { guides: { some: { userId: requester.id } } } : {}),
      },
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    return trip;
  }
}
