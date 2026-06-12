import type { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import * as Res from '../utils/response.js';

export const NotificationController = {
  /**
   * GET /api/v1/notifications
   * Query params: page, limit, unread_only
   */
  async list(req: Request, res: Response) {
    const { page = '1', limit = '20', unread_only } = req.query as Record<string, string>;

    const result = await NotificationService.getUserNotifications(req.user!.sub, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      unread_only: unread_only === 'true',
    });

    return Res.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },

  /**
   * GET /api/v1/notifications/unread-count
   */
  async unreadCount(req: Request, res: Response) {
    const count = await NotificationService.getUnreadCount(req.user!.sub);
    return Res.success(res, { count });
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markRead(req: Request, res: Response) {
    await NotificationService.markRead(req.params.id, req.user!.sub);
    return Res.success(res, null, 'Notificação marcada como lida');
  },

  /**
   * PATCH /api/v1/notifications/read-all
   */
  async markAllRead(req: Request, res: Response) {
    await NotificationService.markAllRead(req.user!.sub);
    return Res.success(res, null, 'Todas as notificações marcadas como lidas');
  },

  /**
   * DELETE /api/v1/notifications/:id
   */
  async dismiss(req: Request, res: Response) {
    await NotificationService.dismiss(req.params.id, req.user!.sub);
    return Res.success(res, null, 'Notificação removida');
  },
};
