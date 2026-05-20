import type { NotificationType } from '@prisma/client';
import { prisma } from '../infra/prisma.js';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  actorId?: string;
  workspaceId?: string;
}

export class NotificationsService {
  async create(params: CreateNotificationParams) {
    return prisma.notification.create({ data: params });
  }

  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}

export const notificationsService = new NotificationsService();
