import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuotesService } from '../../quotes.service';
import { CreateOccupancyActivityDto } from './dto/create-occupancy-activity.dto';
import { UpdateOccupancyActivityDto } from './dto/update-occupancy-activity.dto';

@Injectable()
export class OccupancyActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
  ) {}

  async findAllForOccupancy(
    tenantId: string,
    quoteId: string,
    occupancyId: string,
  ) {
    await this.quotesService.findRaw(tenantId, quoteId);
    const occupancy = await this.findOccupancy(quoteId, occupancyId);

    return this.prisma.quoteOccupancyActivity.findMany({
      where: { quoteOccupancyId: occupancy.id },
      include: { activity: { select: { id: true, name: true } } },
    });
  }

  async create(
    tenantId: string,
    quoteId: string,
    occupancyId: string,
    dto: CreateOccupancyActivityDto,
  ) {
    const quote = await this.quotesService.assertEditable(tenantId, quoteId);
    const occupancy = await this.findOccupancy(quoteId, occupancyId);

    if (dto.quantity > occupancy.adults + occupancy.minors) {
      throw new BadRequestException(
        'quantity no puede exceder el tamaño del grupo (adults + minors)',
      );
    }

    const activity = await this.prisma.activity.findFirst({
      where: { id: dto.activityId, tripId: quote.tripId },
    });
    if (!activity) {
      throw new BadRequestException(
        'activityId no pertenece al viaje de esta cotización',
      );
    }

    const unitPrice = activity.hasExtraCost ? Number(activity.price) : 0;
    const subtotal = dto.quantity * unitPrice;

    const created = await this.prisma.quoteOccupancyActivity.create({
      data: {
        quoteOccupancyId: occupancy.id,
        activityId: dto.activityId,
        quantity: dto.quantity,
        unitPrice,
        subtotal,
      },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return created;
  }

  async update(
    tenantId: string,
    quoteId: string,
    occupancyId: string,
    lineId: string,
    dto: UpdateOccupancyActivityDto,
  ) {
    await this.quotesService.assertEditable(tenantId, quoteId);
    const occupancy = await this.findOccupancy(quoteId, occupancyId);
    const line = await this.findLine(occupancy.id, lineId);

    if (dto.quantity > occupancy.adults + occupancy.minors) {
      throw new BadRequestException(
        'quantity no puede exceder el tamaño del grupo (adults + minors)',
      );
    }

    const updated = await this.prisma.quoteOccupancyActivity.update({
      where: { id: lineId },
      data: {
        quantity: dto.quantity,
        subtotal: dto.quantity * Number(line.unitPrice),
      },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return updated;
  }

  async remove(
    tenantId: string,
    quoteId: string,
    occupancyId: string,
    lineId: string,
  ) {
    await this.quotesService.assertEditable(tenantId, quoteId);
    const occupancy = await this.findOccupancy(quoteId, occupancyId);
    await this.findLine(occupancy.id, lineId);

    const removed = await this.prisma.quoteOccupancyActivity.delete({
      where: { id: lineId },
    });

    await this.quotesService.recalculateTotals(quoteId);
    return removed;
  }

  private async findOccupancy(quoteId: string, occupancyId: string) {
    const occupancy = await this.prisma.quoteOccupancy.findFirst({
      where: { id: occupancyId, quoteId },
    });
    if (!occupancy) {
      throw new NotFoundException('Ocupación no encontrada');
    }
    return occupancy;
  }

  private async findLine(quoteOccupancyId: string, lineId: string) {
    const line = await this.prisma.quoteOccupancyActivity.findFirst({
      where: { id: lineId, quoteOccupancyId },
    });
    if (!line) {
      throw new NotFoundException('Actividad de la ocupación no encontrada');
    }
    return line;
  }
}
