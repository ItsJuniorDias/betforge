import { Router } from 'express';
import { BetController } from '../controllers/bet.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { betRateLimit } from '../middlewares/rateLimit.js';
import { placeBetSchema } from '../validators/bet.validator.js';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// POST /api/v1/bets
router.post('/', betRateLimit, validate(placeBetSchema), BetController.place);

// GET /api/v1/bets
router.get('/', BetController.list);

// GET /api/v1/bets/stats
router.get('/stats', BetController.stats);

// GET /api/v1/bets/:id
router.get('/:id', BetController.getById);

// PATCH /api/v1/bets/:id/settle (Admin only)
router.patch(
  '/:id/settle',
  authorize('admin'),
  BetController.settle
);

export default router;
