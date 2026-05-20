import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  countUnreadNotifications,
  listNotifications,
  listUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', listNotifications);
notificationsRouter.get('/unread', listUnreadNotifications);
notificationsRouter.get('/count', countUnreadNotifications);
notificationsRouter.patch('/:notificationId/read', markNotificationAsRead);
notificationsRouter.patch('/read-all', markAllNotificationsAsRead);
