import { Router } from "express";
import { FinancialController } from "../controllers/financial.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { depositSchema, withdrawSchema } from "../validators/bet.validator.js";

const router = Router();

router.use(authenticate);

// GET /api/v1/financial/balance
router.get("/balance", FinancialController.balance);

// GET /api/v1/financial/transactions
router.get("/transactions", FinancialController.transactions);

// POST /api/v1/financial/deposit
router.post("/deposit", validate(depositSchema), FinancialController.deposit);

// POST /api/v1/financial/withdraw — cria saque pendente (processamento manual)
router.post(
  "/withdraw",
  validate(withdrawSchema),
  FinancialController.withdraw,
);

// PATCH /api/v1/financial/withdraw/:id/confirm — admin confirma que o PIX foi enviado
router.patch("/withdraw/:id/confirm", FinancialController.confirmWithdraw);

// DELETE /api/v1/financial/withdraw/:id — usuário cancela saque pendente (estorna saldo)
router.delete("/withdraw/:id", FinancialController.cancelWithdraw);

// DELETE /api/v1/financial/deposit/:id — cancela charge pendente
router.delete("/deposit/:id", FinancialController.cancelDeposit);

export default router;
