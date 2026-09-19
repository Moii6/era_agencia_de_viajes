import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuoteStatus } from '@erp/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['SENT', 'REJECTED', 'EXPIRED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryQuotesDto) {
    return this.prisma.quote.findMany({
      where: {
        tenantId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.tripId ? { tripId: query.tripId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        trip: { select: { id: true, name: true, departureDate: true } },
        _count: { select: { occupancies: true } },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const quote = await this.findRaw(tenantId, id);

    return this.prisma.quote.findFirst({
      where: { id: quote.id },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        trip: {
          select: {
            id: true,
            name: true,
            departureDate: true,
            returnDate: true,
          },
        },
        occupancies: {
          include: {
            roomType: { select: { id: true, name: true } },
            activities: {
              include: { activity: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  async create(tenantId: string, userId: string, dto: CreateQuoteDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException('clientId no pertenece a este tenant');
    }

    const trip = await this.prisma.trip.findFirst({
      where: { id: dto.tripId, tenantId },
    });
    if (!trip) {
      throw new BadRequestException('tripId no pertenece a este tenant');
    }

    return this.prisma.quote.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        tripId: dto.tripId,
        userId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        subtotal: 0,
        total: 0,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateQuoteDto) {
    const quote = await this.findRaw(tenantId, id);

    if (dto.status && dto.status !== quote.status) {
      this.assertTransitionAllowed(quote.status, dto.status);
    }

    return this.prisma.quote.update({
      where: { id },
      data: {
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        status: dto.status,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const quote = await this.findRaw(tenantId, id);

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se puede eliminar una cotización en estado DRAFT',
      );
    }

    return this.prisma.quote.delete({ where: { id } });
  }

  /** Recomputes subtotal (occupancies only) and total (+ their activities). */
  async recalculateTotals(quoteId: string) {
    const occupancies = await this.prisma.quoteOccupancy.findMany({
      where: { quoteId },
      include: { activities: true },
    });

    const subtotal = occupancies.reduce(
      (sum, o) => sum + Number(o.subtotal),
      0,
    );
    const activitiesTotal = occupancies.reduce(
      (sum, o) =>
        sum + o.activities.reduce((s, a) => s + Number(a.subtotal), 0),
      0,
    );

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { subtotal, total: subtotal + activitiesTotal },
    });
  }

  async assertEditable(tenantId: string, quoteId: string) {
    const quote = await this.findRaw(tenantId, quoteId);

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se puede editar una cotización en estado DRAFT',
      );
    }

    return quote;
  }

  async findRaw(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });
    if (!quote) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return quote;
  }

  private assertTransitionAllowed(from: QuoteStatus, to: QuoteStatus) {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(`No se puede pasar de ${from} a ${to}`);
    }
  }
}
