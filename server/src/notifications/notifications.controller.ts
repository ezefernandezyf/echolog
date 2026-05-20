import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';

export const listNotifications = async (req: Request, res: Response) => {
  const data = await notificationsService.list(req.userId!);
  res.json(data);
};

export const listUnreadNotifications = async (req: Request, res: Response) => {
  const data = await notificationsService.listUnread(req.userId!);
  res.json(data);
};

export const countUnreadNotifications = async (req: Request, res: Response) => {
  const count = await notificationsService.countUnread(req.userId!);
  res.json({ count });
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  await notificationsService.markAsRead(req.params.notificationId as string, req.userId!);
  res.status(204).send();
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  await notificationsService.markAllAsRead(req.userId!);
  res.status(204).send();
};
