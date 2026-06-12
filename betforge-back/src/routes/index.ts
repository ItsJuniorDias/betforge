import { Router, type Request, type Response } from 'express';
import authRoutes from './auth.routes.js';
import betRoutes from './bet.routes.js';
import financialRoutes from './financial.routes.js';
import userRoutes from './user.routes.js';
import gamesRoutes from './games.routes.js';
import webhookRoutes from './webhook.routes.js';
import notificationRoutes from './notification.routes.js';
import casinoRoutes from './casino.routes.js';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'BetForge API está no ar! 🚀',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/bets', betRoutes);
router.use('/financial', financialRoutes);
router.use('/users', userRoutes);
router.use('/games', gamesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/webhooks', webhookRoutes);   // ← Mercado Pago webhooks
router.use('/casino', casinoRoutes);      // ← PlayFiver cassino

export default router;
