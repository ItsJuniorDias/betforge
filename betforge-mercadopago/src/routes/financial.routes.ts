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

// POST /api/v1/financial/deposit  — cria charge Pagar.me
router.post('/deposit', validate(depositSchema), FinancialController.deposit);

// POST /api/v1/financial/withdraw — dispara PIX transfer Pagar.me
router.post('/withdraw', validate(withdrawSchema), FinancialController.withdraw);

// DELETE /api/v1/financial/deposit/:id — cancela charge pendente
router.delete('/deposit/:id', FinancialController.cancelDeposit);

export default router;
