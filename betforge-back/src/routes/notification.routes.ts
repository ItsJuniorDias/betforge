import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// GET  /api/v1/notifications
router.get('/', NotificationController.list);

// GET  /api/v1/notifications/unread-count
router.get('/unread-count', NotificationController.unreadCount);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', NotificationController.markAllRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', NotificationController.markRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', NotificationController.dismiss);

export default router;
