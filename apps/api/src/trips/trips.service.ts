import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripPhase, TripStatus, UserRole } from '@erp/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

type Requester = { id: string; role: UserRole };

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// departureDate is a pure calendar date (UTC midnight, see formatDate's
// comment on the frontend); departureTime is free text ("08:00") with no
// format enforced at the DB level, since older trips may predate the
// time input existing at all. Falling back to UTC midnight of that date
// when the time is missing/unparseable would make the trip "start" the
// instant its calendar day begins, which defeats the point of respecting
// an actual departure time — so this returns null instead, meaning
// "can't tell yet, don't advance" (see autoAdvanceIfNeeded).
function combineDateAndTime(date: Date, time: string | null): Date | null {
  const match = time?.match(TIME_PATTERN);
  if (!match) return null;
  const combined = new Date(date);
  combined.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);
  return combined;
}

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // A GUIDE may not be a fixed employee — they only ever see trips they're
  // assigned to. Every other role sees the whole tenant. `requester` is
  // omitted for internal calls (e.g. from update()) that don't need the
  // guide restriction applied.
  async findAll(tenantId: string, query: QueryTripsDto, requester?: Requester) {
    const trips = await this.prisma.trip.findMany({
      where: {
        tenantId,
        ...(query.status ? { status: query.status } : {}),
        ...(requester?.role === 'GUIDE' ? { guides: { some: { userId: requester.id } } } : {}),
      },
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
    return Promise.all(trips.map((trip) => this.autoAdvanceIfNeeded(trip)));
  }

  async findById(tenantId: string, id: string, requester?: Requester) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id,
        tenantId,
        ...(requester?.role === 'GUIDE' ? { guides: { some: { userId: requester.id } } } : {}),
      },
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

    return this.autoAdvanceIfNeeded(trip);
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
    if (dto.status === 'IN_PROGRESS') {
      throw new BadRequestException(
        'IN_PROGRESS se aplica automáticamente al llegar la fecha y hora de salida, no se puede elegir a mano',
      );
    }
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

  // A trip past its departure date+time self-heals to IN_PROGRESS the next
  // time it's touched (read or write) — no scheduler, same lazy pattern as
  // Quote.autoExpireIfNeeded. DRAFT is deliberately excluded: a trip that
  // was never published can't "start" just because its date came and went
  // — it stays DRAFT until someone notices and publishes or cancels it.
  // COMPLETED/CANCELLED stay untouched too: the agent marks those by hand
  // (deliberately not automated — see PLANNING.md). Without a parseable
  // departureTime, combineDateAndTime returns null — there's no real hour
  // to respect yet, so the trip simply doesn't advance until one is set.
  private async autoAdvanceIfNeeded<
    T extends {
      id: string;
      status: TripStatus;
      departureDate: Date;
      departureTime: string | null;
      currentPhase: TripPhase | null;
    },
  >(trip: T): Promise<T> {
    const canAdvance = trip.status === 'PUBLISHED' || trip.status === 'CLOSED';
    const departureAt = combineDateAndTime(trip.departureDate, trip.departureTime);
    if (!canAdvance || !departureAt || departureAt.getTime() > Date.now()) {
      return trip;
    }

    await this.prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'IN_PROGRESS', currentPhase: 'CHECKIN_DEPARTURE' },
    });
    return { ...trip, status: 'IN_PROGRESS', currentPhase: 'CHECKIN_DEPARTURE' };
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
