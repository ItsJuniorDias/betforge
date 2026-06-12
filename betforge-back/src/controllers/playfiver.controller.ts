import type { Request, Response } from 'express';
import { PlayFiverService } from '../services/playfiver.service.js';
import { PlayFiverCallbackService } from '../services/playfiver-callback.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as Res from '../utils/response.js';
import crypto from 'crypto';

// ─── Verificação de assinatura do callback ────────────────────────────────────
function verifyCallbackSignature(req: Request): boolean {
  if (!env.PLAYFIVER_WEBHOOK_SECRET) {
    logger.warn('[PlayFiver] PLAYFIVER_WEBHOOK_SECRET não configurado — pulando verificação');
    return true;
  }

  const signature = req.headers['x-playfiver-signature'] as string;
  if (!signature) return false;

  const rawBody = (req as any).rawBody as Buffer | undefined;
  const body = rawBody ? rawBody.toString('utf8') : JSON.stringify(req.body);

  const expected = crypto
    .createHmac('sha256', env.PLAYFIVER_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

export const PlayFiverController = {

  /**
   * GET /api/v1/casino/games
   * Lista jogos disponíveis. Requer autenticação.
   * Query: ?category= &provider= &search= &page= &limit=
   */
  async listGames(req: Request, res: Response) {
    const { category, provider, search, page = '1', limit = '50' } = req.query as Record<string, string>;

    const result = await PlayFiverService.listGames({
      category,
      provider,
      search,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 200),
    });

    return Res.success(res, result);
  },

  /**
   * GET /api/v1/casino/providers
   * Retorna lista de provedores disponíveis para filtros.
   */
  async listProviders(req: Request, res: Response) {
    const providers = await PlayFiverService.listProviders();
    return Res.success(res, providers);
  },

  /**
   * GET /api/v1/casino/categories
   * Retorna lista de categorias disponíveis para filtros.
   */
  async listCategories(req: Request, res: Response) {
    const categories = await PlayFiverService.listCategories();
    return Res.success(res, categories);
  },

  /**
   * POST /api/v1/casino/launch
   * Cria sessão de jogo e retorna a URL.
   * Body: { game_id: string, demo?: boolean, locale?: string }
   */
  async launchGame(req: Request, res: Response) {
    const userId = req.user!.sub;
    const { game_id, demo = false, locale = 'pt-BR' } = req.body;

    if (!game_id) {
      throw new AppError('game_id é obrigatório', 400, 'MISSING_GAME_ID');
    }

    // Verifica se usuário existe e está ativo
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    if (user.status !== 'active') {
      throw new AppError('Conta suspensa ou pendente de verificação', 403, 'ACCOUNT_INACTIVE');
    }

    // Em modo real, verifica saldo mínimo (R$ 0,01)
    if (!demo && Number(user.balance) <= 0) {
      throw new AppError(
        'Saldo insuficiente para jogar. Faça um depósito.',
        402,
        'INSUFFICIENT_BALANCE',
      );
    }

    logger.info('[PlayFiver] launchGame request', { userId, game_id, demo });

    const session = await PlayFiverService.launchGame(userId, game_id, demo, locale);

    return Res.success(res, {
      game_url: session.game_url,
      session_id: session.session_id,
      expires_at: session.expires_at,
    });
  },

  /**
   * POST /api/v1/casino/callback
   * Endpoint chamado pela PlayFiver para processar debit/credit/rollback.
   * NÃO requer autenticação JWT — usa HMAC-SHA256 via PLAYFIVER_WEBHOOK_SECRET.
   */
  async callback(req: Request, res: Response) {
    if (!verifyCallbackSignature(req)) {
      logger.warn('[PlayFiver] Callback com assinatura inválida', {
        ip: req.ip,
        body: req.body,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;

    try {
      const result = await PlayFiverCallbackService.handle(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      logger.error('[PlayFiver] Callback error', { err, payload });

      // PlayFiver espera erros estruturados
      const status = err?.statusCode ?? 500;
      const code   = err?.code ?? 'INTERNAL_ERROR';
      return res.status(status).json({ error: code, message: err?.message });
    }
  },

  /**
   * POST /api/v1/casino/cache/invalidate (admin only)
   * Invalida o cache de jogos para forçar refresh.
   */
  async invalidateCache(req: Request, res: Response) {
    await PlayFiverService.invalidateCache();
    return Res.success(res, { message: 'Cache invalidado com sucesso.' });
  },
};
