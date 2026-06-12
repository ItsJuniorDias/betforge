import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationsParams } from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (params?: NotificationsParams) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/** Lista de notificações com paginação */
export function useNotifications(params: NotificationsParams = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationService.getNotifications(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30s
  });
}

/** Contador de não lidas — usado no Header */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // auto-refresh a cada 1 min
  });
}

/** Marcar uma notificação como lida */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Marcar todas como lidas */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Dispensar (deletar) uma notificação */
export function useDismissNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
