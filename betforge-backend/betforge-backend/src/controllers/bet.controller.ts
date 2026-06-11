import type { Request, Response } from 'express';
import { BetService } from '../services/bet.service.js';
import * as Res from '../utils/response.js';

export const BetController = {
  async place(req: Request, res: Response) {
    const bet = await BetService.placeBet({
      userId: req.user!.sub,
      ...req.body,
    });
    return Res.created(res, bet, 'Aposta realizada com sucesso!');
  },

  async list(req: Request, res: Response) {
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;
    const result = await BetService.getUserBets(req.user!.sub, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      status,
    });
    return Res.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },

  async getById(req: Request, res: Response) {
    const bet = await BetService.getBetById(req.params.id, req.user!.sub);
    return Res.success(res, bet);
  },

  async stats(req: Request, res: Response) {
    const stats = await BetService.getUserStats(req.user!.sub);
    return Res.success(res, stats);
  },

  // Admin only
  async settle(req: Request, res: Response) {
    const { winnerPickIds } = req.body;
    const bet = await BetService.settleBet(req.params.id, winnerPickIds);
    return Res.success(res, bet, 'Aposta liquidada com sucesso!');
  },
};
