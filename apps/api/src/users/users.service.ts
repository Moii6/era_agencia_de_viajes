import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// The agency can have at most 2 OWNER accounts.
const MAX_OWNERS_PER_TENANT = 2;

// Two-owner approval workflow: once a tenant has 2 active OWNERs, every
// create/edit by anyone (owner or admin) sits pending until the *other*
// OWNER approves it. Below that — a brand-new tenant with only its
// founding OWNER — there's nobody else to check them, so changes apply
// immediately; otherwise the very first user they ever add would be
// permanently stuck with no one able to approve it.
const APPROVAL_REQUIRED_FROM_OWNER_COUNT = 2;

const SELECT_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  requestedByUserId: true,
  pendingName: true,
  pendingEmail: true,
  pendingRole: true,
  requestedBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: SELECT_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { ...SELECT_FIELDS, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async create(tenantId: string, requesterId: string, dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    if (dto.role === 'OWNER') {
      await this.assertOwnerCapNotExceeded(tenantId);
    }

    const approvalRequired = await this.approvalIsRequired(tenantId);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        name: dto.name.trim(),
        passwordHash,
        role: dto.role,
        status: approvalRequired ? 'PENDING' : 'ACTIVE',
        requestedByUserId: requesterId,
      },
      select: SELECT_FIELDS,
    });

    return user;
  }

  async update(
    tenantId: string,
    requesterId: string,
    userId: string,
    dto: UpdateUserDto,
  ) {
    const target = await this.findRaw(tenantId, userId);

    if (target.status === 'PENDING') {
      throw new BadRequestException(
        'Este usuario tiene un alta pendiente de aprobación — apruébala o recházala antes de editarlo',
      );
    }

    const nextEmail = dto.email?.toLowerCase();
    if (nextEmail && nextEmail !== target.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: nextEmail },
      });
      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const nextRole = dto.role ?? target.role;
    if (nextRole === 'OWNER' && target.role !== 'OWNER') {
      await this.assertOwnerCapNotExceeded(tenantId, userId);
    }

    const approvalRequired = await this.approvalIsRequired(tenantId);

    if (!approvalRequired) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name?.trim() ?? target.name,
          email: nextEmail ?? target.email,
          role: nextRole,
          requestedByUserId: null,
          pendingName: null,
          pendingEmail: null,
          pendingRole: null,
        },
        select: SELECT_FIELDS,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingName: dto.name?.trim() ?? target.name,
        pendingEmail: nextEmail ?? target.email,
        pendingRole: nextRole,
        requestedByUserId: requesterId,
      },
      select: SELECT_FIELDS,
    });
  }

  async approve(tenantId: string, approverId: string, userId: string) {
    const target = await this.assertHasPendingRequest(
      tenantId,
      approverId,
      userId,
    );

    if (target.status === 'PENDING') {
      return this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE', requestedByUserId: null },
        select: SELECT_FIELDS,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: target.pendingName ?? target.name,
        email: target.pendingEmail ?? target.email,
        role: target.pendingRole ?? target.role,
        pendingName: null,
        pendingEmail: null,
        pendingRole: null,
        requestedByUserId: null,
      },
      select: SELECT_FIELDS,
    });
  }

  async reject(tenantId: string, approverId: string, userId: string) {
    const target = await this.assertHasPendingRequest(
      tenantId,
      approverId,
      userId,
    );

    if (target.status === 'PENDING') {
      return this.prisma.user.delete({
        where: { id: userId },
        select: SELECT_FIELDS,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingName: null,
        pendingEmail: null,
        pendingRole: null,
        requestedByUserId: null,
      },
      select: SELECT_FIELDS,
    });
  }

  // Deactivation is deliberately immediate and unilateral — unlike create/
  // edit, it's a security response (someone left the agency, access needs
  // to go away now), so it skips the two-owner approval flow on purpose.
  // Reactivating is the same: one OWNER can undo a deactivation on their own.
  async deactivate(tenantId: string, requesterId: string, userId: string) {
    if (userId === requesterId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    const target = await this.findRaw(tenantId, userId);
    if (target.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se puede desactivar un usuario activo',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
      select: SELECT_FIELDS,
    });
  }

  async reactivate(tenantId: string, userId: string) {
    const target = await this.findRaw(tenantId, userId);
    if (target.status !== 'INACTIVE') {
      throw new BadRequestException(
        'Solo se puede reactivar un usuario inactivo',
      );
    }

    if (target.role === 'OWNER') {
      await this.assertOwnerCapNotExceeded(tenantId, userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: SELECT_FIELDS,
    });
  }

  private async assertHasPendingRequest(
    tenantId: string,
    approverId: string,
    userId: string,
  ) {
    const target = await this.findRaw(tenantId, userId);

    const hasPendingChange =
      target.status === 'PENDING' ||
      !!target.pendingName ||
      !!target.pendingEmail ||
      !!target.pendingRole;

    if (!target.requestedByUserId || !hasPendingChange) {
      throw new BadRequestException(
        'Este usuario no tiene nada pendiente de aprobación',
      );
    }
    if (target.requestedByUserId === approverId) {
      throw new BadRequestException(
        'No puedes aprobar o rechazar tu propia solicitud — necesitas al otro OWNER',
      );
    }

    return target;
  }

  /** Whether the tenant already has enough active OWNERs that a create/edit needs the other one's sign-off. */
  private async approvalIsRequired(tenantId: string) {
    const activeOwners = await this.prisma.user.count({
      where: { tenantId, role: 'OWNER', status: 'ACTIVE' },
    });
    return activeOwners >= APPROVAL_REQUIRED_FROM_OWNER_COUNT;
  }

  private async assertOwnerCapNotExceeded(
    tenantId: string,
    excludeUserId?: string,
  ) {
    const ownerCount = await this.prisma.user.count({
      where: {
        tenantId,
        role: 'OWNER',
        status: { in: ['ACTIVE', 'PENDING'] },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });
    if (ownerCount >= MAX_OWNERS_PER_TENANT) {
      throw new BadRequestException(
        `Ya existen ${MAX_OWNERS_PER_TENANT} usuarios con rol OWNER en esta agencia`,
      );
    }
  }

  private async findRaw(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }
}
