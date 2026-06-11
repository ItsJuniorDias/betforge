import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();

/**
 * POST /api/v1/webhooks/mercadopago
 *
 * Esta rota NÃO usa o middleware authenticate, pois o Mercado Pago não envia JWT.
 * A autenticação é feita pela assinatura HMAC (x-signature).
 *
 * IMPORTANTE: o body desta rota precisa ser capturado como raw Buffer
 * para validar a assinatura. Veja o middleware rawBody em app.ts.
 */
router.post('/mercadopago', WebhookController.mercadopago);

export default router;
