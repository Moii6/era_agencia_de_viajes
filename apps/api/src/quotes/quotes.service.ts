import { randomBytes } from 'crypto';
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

// EXPIRED is deliberately never a manual target here — it's set only by
// autoExpireIfNeeded, once validUntil passes. CANCELLED is the manual
// equivalent for any other reason the agent needs to kill a quote early.
const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

// The agency's income is the commission on each booked trip — every quote
// carries it as its own line item rather than folding it invisibly into total.
export const QUOTE_COMMISSION_RATE = 0.05;

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryQuotesDto) {
    const quotes = await this.prisma.quote.findMany({
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
    return Promise.all(quotes.map((quote) => this.autoExpireIfNeeded(quote)));
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

    // First time a quote is sent, mint the token that backs its public,
    // no-login share link. It's kept afterward even through later status
    // changes (ACCEPTED, REJECTED...) so a previously shared link keeps working.
    const needsShareToken = dto.status === 'SENT' && !quote.shareToken;

    return this.prisma.quote.update({
      where: { id },
      data: {
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        status: dto.status,
        shareToken: needsShareToken ? randomBytes(24).toString('hex') : undefined,
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
  /** subtotal = rooms + activities; commission = 5% of subtotal; total = subtotal + commission. */
  async recalculateTotals(quoteId: string) {
    const occupancies = await this.prisma.quoteOccupancy.findMany({
      where: { quoteId },
      include: { activities: true },
    });

    const roomsTotal = occupancies.reduce(
      (sum, o) => sum + Number(o.subtotal),
      0,
    );
    const activitiesTotal = occupancies.reduce(
      (sum, o) =>
        sum + o.activities.reduce((s, a) => s + Number(a.subtotal), 0),
      0,
    );

    const subtotal = roomsTotal + activitiesTotal;
    const commission = subtotal * QUOTE_COMMISSION_RATE;
    const total = subtotal + commission;

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { subtotal, commission, total },
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

  // Public, unauthenticated lookup for the client-facing share link — the
  // token itself is the access control, so this isn't scoped by tenantId.
  // Deliberately returns no pricing breakdown (subtotal/commission), only
  // the final total, per the agency's choice not to expose the commission
  // line to clients.
  async findByShareToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { shareToken: token },
      include: {
        client: { select: { name: true } },
        trip: {
          select: {
            name: true,
            destination: true,
            departureDate: true,
            departurePoint: true,
            returnDate: true,
            returnPoint: true,
          },
        },
        occupancies: {
          include: {
            roomType: { select: { name: true } },
            activities: { include: { activity: { select: { name: true } } } },
          },
        },
      },
    });
    if (!quote) {
      throw new NotFoundException('Cotización no encontrada');
    }
    const { status } = await this.autoExpireIfNeeded(quote);

    return {
      client: quote.client,
      trip: quote.trip,
      status,
      currency: quote.currency,
      total: quote.total,
      validUntil: quote.validUntil,
      notes: quote.notes,
      occupancies: quote.occupancies.map((o) => ({
        label: o.label,
        roomType: o.roomType,
        adults: o.adults,
        minors: o.minors,
        activities: o.activities.map((a) => ({
          name: a.activity.name,
          quantity: a.quantity,
        })),
      })),
    };
  }

  async findRaw(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
    });
    if (!quote) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return this.autoExpireIfNeeded(quote);
  }

  // A quote never gets a background job flipping it to EXPIRED — instead,
  // any DRAFT/SENT quote past its validUntil self-heals to EXPIRED the next
  // time it's touched through the service (read or write). Since every
  // other method funnels through findRaw (or calls this directly), that
  // covers all real access paths without needing a scheduler.
  private async autoExpireIfNeeded<
    T extends { id: string; status: QuoteStatus; validUntil: Date | null },
  >(quote: T): Promise<T> {
    const canExpire = quote.status === 'DRAFT' || quote.status === 'SENT';
    if (!canExpire || !quote.validUntil || quote.validUntil.getTime() >= Date.now()) {
      return quote;
    }

    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'EXPIRED' },
    });
    return { ...quote, status: 'EXPIRED' };
  }

  private assertTransitionAllowed(from: QuoteStatus, to: QuoteStatus) {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(`No se puede pasar de ${from} a ${to}`);
    }
  }
}
