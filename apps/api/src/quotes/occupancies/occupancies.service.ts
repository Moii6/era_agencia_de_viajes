import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotesService } from '../quotes.service';
import { CreateOccupancyDto } from './dto/create-occupancy.dto';
import { UpdateOccupancyDto } from './dto/update-occupancy.dto';

@Injectable()
export class OccupanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
  ) {}

  async findAllForQuote(tenantId: string, quoteId: string) {
    await this.quotesService.findRaw(tenantId, quoteId);

    return this.prisma.quoteOccupancy.findMany({
      where: { quoteId },
      include: {
        roomType: { select: { id: true, name: true } },
        activities: true,
      },
    });
  }

  async create(tenantId: string, quoteId: string, dto: CreateOccupancyDto) {
    const quote = await this.quotesService.assertEditable(tenantId, quoteId);

    if (dto.adults + dto.minors < 1) {
      throw new BadRequestException(
        'La ocupación debe tener al menos un adulto o menor',
      );
    }

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, tripId: quote.tripId },
    });
    if (!roomType) {
      throw new BadRequestException(
        'roomTypeId no pertenece al viaje de esta cotización',
      );
    }
    if (dto.adults + dto.minors > roomType.maxOccupancy) {
      throw new BadRequestException(
        `La ocupación (${dto.adults + dto.minors}) excede la capacidad de "${roomType.name}" (${roomType.maxOccupancy})`,
      );
    }

    const trip = await this.prisma.trip.findUniqueOrThrow({
      where: { id: quote.tripId },
      select: { departureDate: true, returnDate: true },
    });
    const nights = this.nightsBetween(trip.departureDate, trip.returnDate);

    const unitPricePerNight = Number(roomType.pricePerNight);
    // Room cost is per night, flat — the same whether adults or minors
    // occupy it — so it never depends on the adults/minors headcount.
    const subtotal = unitPricePerNight * nights;

    const occupancy = await this.prisma.quoteOccupancy.create({
      data: {
        quoteId,
        roomTypeId: dto.roomTypeId,
        label: dto.label,
        adults: dto.adults,
        minors: dto.minors,
        unitPricePerNight,
        subtotal,
      },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return occupancy;
  }

  async update(
    tenantId: string,
    quoteId: string,
    occupancyId: string,
    dto: UpdateOccupancyDto,
  ) {
    await this.quotesService.assertEditable(tenantId, quoteId);
    const occupancy = await this.findOne(quoteId, occupancyId);

    const adults = dto.adults ?? occupancy.adults;
    const minors = dto.minors ?? occupancy.minors;

    if (adults + minors < 1) {
      throw new BadRequestException(
        'La ocupación debe tener al menos un adulto o menor',
      );
    }

    const roomType = await this.prisma.roomType.findUniqueOrThrow({
      where: { id: occupancy.roomTypeId },
    });
    if (adults + minors > roomType.maxOccupancy) {
      throw new BadRequestException(
        `La ocupación (${adults + minors}) excede la capacidad de "${roomType.name}" (${roomType.maxOccupancy})`,
      );
    }

    // adults/minors only affect capacity/headcount tracking here — the
    // room's subtotal is a flat per-night rate and doesn't change with them.
    return this.prisma.quoteOccupancy.update({
      where: { id: occupancyId },
      data: { label: dto.label, adults, minors },
    });
  }

  async remove(tenantId: string, quoteId: string, occupancyId: string) {
    await this.quotesService.assertEditable(tenantId, quoteId);
    await this.findOne(quoteId, occupancyId);

    const removed = await this.prisma.quoteOccupancy.delete({
      where: { id: occupancyId },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return removed;
  }

  private async findOne(quoteId: string, occupancyId: string) {
    const occupancy = await this.prisma.quoteOccupancy.findFirst({
      where: { id: occupancyId, quoteId },
    });
    if (!occupancy) {
      throw new NotFoundException('Ocupación no encontrada');
    }
    return occupancy;
  }

  private nightsBetween(departureDate: Date, returnDate: Date) {
    const ms = returnDate.getTime() - departureDate.getTime();
    return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
  }
}
