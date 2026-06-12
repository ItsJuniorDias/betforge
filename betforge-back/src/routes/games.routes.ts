import { Router } from 'express';
import { GamesController } from '../controllers/games.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// GET /api/v1/games          — todos (live + scheduled), ?sport= &league= &status= &page= &limit=
router.get('/', GamesController.list);

// GET /api/v1/games/live     — somente ao vivo, ?sport=
router.get('/live', GamesController.live);

// POST /api/v1/games/sync    — força refresh imediato (somente admin)
router.post('/sync', authenticate, authorize('admin'), GamesController.forceSync);

// GET /api/v1/games/:id      — detalhe do jogo + todos os mercados/odds
router.get('/:id', GamesController.getById);

// GET /api/v1/games/:id/markets — só os mercados
router.get('/:id/markets', GamesController.getMarkets);

export default router;
