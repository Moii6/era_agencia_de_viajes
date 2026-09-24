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

    // subtotal is whatever the hotel quoted for the whole stay — typed in
    // directly, not computed from adults/minors (that reservation happens
    // on the hotel's own site, at whatever price it shows that day).
    const occupancy = await this.prisma.quoteOccupancy.create({
      data: {
        quoteId,
        roomTypeId: dto.roomTypeId,
        label: dto.label,
        adults: dto.adults,
        minors: dto.minors,
        subtotal: dto.subtotal,
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

    const updated = await this.prisma.quoteOccupancy.update({
      where: { id: occupancyId },
      data: {
        label: dto.label,
        adults,
        minors,
        subtotal: dto.subtotal ?? occupancy.subtotal,
      },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return updated;
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
}
