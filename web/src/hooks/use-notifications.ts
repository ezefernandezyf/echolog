import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { queryKeys } from './query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list('all'),
    queryFn: () => notificationsApi.list(),
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationsApi.listUnread(),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.count,
    queryFn: () => notificationsApi.countUnread(),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list('all') });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list('all') });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}
