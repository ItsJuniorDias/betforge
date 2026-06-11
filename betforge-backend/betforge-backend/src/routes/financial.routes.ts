import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { depositSchema, withdrawSchema } from '../validators/bet.validator.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/financial/balance
router.get('/balance', FinancialController.balance);

// GET /api/v1/financial/transactions
router.get('/transactions', FinancialController.transactions);

// POST /api/v1/financial/deposit
router.post('/deposit', validate(depositSchema), FinancialController.deposit);

// POST /api/v1/financial/withdraw
router.post('/withdraw', validate(withdrawSchema), FinancialController.withdraw);

export default router;
