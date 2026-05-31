import { createVoidFetcher, fetchJson } from './client';
import type { NotificationDTO, UnreadCountDTO } from '../../../shared/contracts/index.js';

export const notificationsApi = {
  list: createVoidFetcher<NotificationDTO[]>('GET', '/notifications'),
  listUnread: createVoidFetcher<NotificationDTO[]>('GET', '/notifications/unread'),
  countUnread: createVoidFetcher<UnreadCountDTO>('GET', '/notifications/count'),
  markAsRead: (notificationId: string) =>
    fetchJson<void>({ url: `/notifications/${notificationId}/read`, method: 'PATCH' }),
  markAllAsRead: createVoidFetcher<void>('PATCH', '/notifications/read-all'),
};
