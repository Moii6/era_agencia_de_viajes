import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

// The agency can have at most 2 OWNER accounts. There's no user-editing
// capability yet (no role changes, no deactivation), so this cap is
// enforced only here, at creation time.
const MAX_OWNERS_PER_TENANT = 2;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenantId: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    if (dto.role === 'OWNER') {
      const ownerCount = await this.prisma.user.count({
        where: { tenantId, role: 'OWNER', status: 'ACTIVE' },
      });
      if (ownerCount >= MAX_OWNERS_PER_TENANT) {
        throw new BadRequestException(
          `Ya existen ${MAX_OWNERS_PER_TENANT} usuarios con rol OWNER en esta agencia`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        name: dto.name.trim(),
        passwordHash,
        role: dto.role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
      },
    });

    return user;
  }
}
