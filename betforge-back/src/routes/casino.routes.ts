import { Router } from 'express';
import { PlayFiverController } from '../controllers/playfiver.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// ─── Público (requer autenticação JWT) ────────────────────────────────────────

// GET /api/v1/casino/games?category=slots&provider=pragmatic&search=olympus&page=1&limit=50
router.get('/games', authenticate, PlayFiverController.listGames);

// GET /api/v1/casino/providers
router.get('/providers', authenticate, PlayFiverController.listProviders);

// GET /api/v1/casino/categories
router.get('/categories', authenticate, PlayFiverController.listCategories);

// POST /api/v1/casino/launch  { game_id, demo?, locale? }
router.post('/launch', authenticate, PlayFiverController.launchGame);

// ─── Callback PlayFiver (sem JWT — autenticado por HMAC) ──────────────────────

// POST /api/v1/casino/callback
router.post('/callback', PlayFiverController.callback);

// ─── Admin ────────────────────────────────────────────────────────────────────

// POST /api/v1/casino/cache/invalidate
router.post(
  '/cache/invalidate',
  authenticate,
  authorize('admin'),
  PlayFiverController.invalidateCache,
);

export default router;
