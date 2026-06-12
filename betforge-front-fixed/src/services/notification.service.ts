import { api } from './api';
import type { ApiSuccess, ApiPaginated } from '../types/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'bet_settled'
  | 'deposit_confirmed'
  | 'withdraw_processed'
  | 'promotion'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationsParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

// ─── Serviço ─────────────────────────────────────────────────────────────────

export const notificationService = {
  async getNotifications(params: NotificationsParams = {}) {
    const { data } = await api.get<ApiPaginated<Notification>>('/notifications', { params });
    return { data: data.data, meta: data.meta };
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<ApiSuccess<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async dismiss(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
