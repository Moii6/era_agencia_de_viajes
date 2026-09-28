import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationParams = {
  type: string;
  message: string;
  link?: string;
  relatedId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, params: NotificationParams) {
    return this.prisma.notification.create({
      data: { tenantId, userId, ...params },
    });
  }

  async createMany(tenantId: string, userIds: string[], params: NotificationParams) {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ tenantId, userId, ...params })),
    });
  }

  // Bulk-resolves every notification tied to the same underlying request
  // (e.g. all the approvers who got pinged about one pending user) once
  // that request is handled — so nobody is left with a stale "pending"
  // notification for something that's already been decided.
  async resolveRelated(tenantId: string, type: string, relatedId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, type, relatedId, read: false },
      data: { read: true },
    });
  }

  async findForUser(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });
  }
}
