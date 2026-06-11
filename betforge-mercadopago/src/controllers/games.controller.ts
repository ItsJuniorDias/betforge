import type { Request, Response } from "express";
import { GamesService } from "../services/games.service.js";
import { OddsSyncService } from "../services/odds-sync.service.js";
import { NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";
import * as Res from "../utils/response.js";

/**
 * Roda o sync sob demanda antes de cada resposta.
 * Se ODDS_API_KEY não estiver configurado, pula silenciosamente
 * (o banco ainda serve os dados do seed).
 */
async function syncIfNeeded(
  sports: Array<"football" | "basketball"> = ["football", "basketball"],
) {
  if (!env.ODDS_API_KEY) return;
  await OddsSyncService.sync(sports).catch((err) => {
    // Erro de rede / cota esgotada não deve derrubar a resposta
    console.warn("[GamesController] sync falhou:", err?.message ?? err);
  });
}

export const GamesController = {
  async list(req: Request, res: Response) {
    const {
      sport,
      league,
      status,
      page = "1",
      limit = "30",
    } = req.query as Record<string, string>;

    await syncIfNeeded();

    const result = await GamesService.listGames({
      sport,
      league,
      status,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
    });

    return Res.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },

  async live(req: Request, res: Response) {
    const { sport } = req.query as Record<string, string>;

    await syncIfNeeded();

    const data = await GamesService.getLiveGames(sport);

    return Res.success(res, data);
  },

  async getById(req: Request, res: Response) {
    // Para detalhe de um jogo específico, sync só do esporte relevante
    await syncIfNeeded();

    const game = await GamesService.getGameById(req.params.id);
    if (!game) throw new NotFoundError("Partida não encontrada");
    return Res.success(res, game);
  },

  async getMarkets(req: Request, res: Response) {
    await syncIfNeeded();

    const markets = await GamesService.getGameMarkets(req.params.id);
    if (!markets.length)
      throw new NotFoundError("Partida não encontrada ou sem mercados");
    return Res.success(res, markets);
  },

  // POST /api/v1/games/sync  (admin — força refresh imediato)
  async forceSync(req: Request, res: Response) {
    if (!env.ODDS_API_KEY) {
      return Res.success(res, {
        message: "ODDS_API_KEY não configurada, nada a sincronizar.",
      });
    }
    await OddsSyncService.forceSync();
    return Res.success(res, {
      message: "Sync concluído.",
      lastSyncAt: new Date(OddsSyncService.getLastSyncAt()).toISOString(),
    });
  },
};
