import { db } from "../config/database.js";
import type {
  Notification,
  NotificationType,
  PaginationParams,
  PaginationResult,
} from "../types/index.js";

const TABLE = "notifications";

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const NotificationRepository = {
  async create(data: CreateNotificationData): Promise<Notification> {
    const [notif] = await db<Notification>(TABLE)
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        is_read: false,
        metadata: data.metadata ?? {},
      })
      .returning("*");
    return notif;
  },

  async findByUserId(
    userId: string,
    params: PaginationParams & { unread_only?: boolean },
  ): Promise<PaginationResult<Notification>> {
    const { page, limit, unread_only } = params;
    const offset = (page - 1) * limit;

    let query = db<Notification>(TABLE).where({ user_id: userId });
    if (unread_only) query = query.where({ is_read: false });

    const countResult = await query.clone().count("id as count");
    const count = (countResult[0] as unknown as { count: string | number })
      .count;

    const data = await query
      .clone()
      .select()
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  },

  async countUnread(userId: string): Promise<number> {
    const countResult = await db<Notification>(TABLE)
      .where({ user_id: userId, is_read: false })
      .count("id as count");

    const count = (countResult[0] as unknown as { count: string | number })
      .count;
    return Number(count);
  },

  async markRead(id: string, userId: string): Promise<boolean> {
    const updated = await db<Notification>(TABLE)
      .where({ id, user_id: userId })
      .update({ is_read: true, updated_at: new Date() });
    return updated > 0;
  },

  async markAllRead(userId: string): Promise<number> {
    return db<Notification>(TABLE)
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true, updated_at: new Date() });
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db<Notification>(TABLE)
      .where({ id, user_id: userId })
      .delete();
    return deleted > 0;
  },
};
