/**
 * SettlementService
 *
 * Liquida automaticamente apostas pendentes cujas partidas já terminaram,
 * creditando ou não o saldo do usuário conforme o resultado real da API.
 *
 * Fluxo:
 *  1. Busca todas as apostas com status='pending' que tenham pelo menos
 *     uma seleção apontando para uma partida com status='finished' no banco.
 *  2. Para cada partida finalizada, determina o(s) vencedor(es) com base
 *     nos campos home_score / away_score registrados pelo OddsSyncService.
 *  3. Chama BetService.settleBet(...) com os pick IDs vencedores.
 *
 * Regras de liquidação por tipo de mercado:
 *   1x2  → pick "home" | "draw" | "away"  baseado no placar final
 *   over_under → pick "over" | "under"    baseado no total de gols
 *
 * Como o OddsSyncService já persiste home_score/away_score e muda o
 * status para 'finished' quando a API reportar completed=true, este
 * serviço só precisa ler o banco — sem chamar a API externa novamente.
 */

import { db } from '../config/database.js';
import { BetService } from './bet.service.js';
import { logger } from '../utils/logger.js';

// ─── Helpers de resultado ─────────────────────────────────────────────────────

/**
 * Dado o mercado e o placar final, retorna os picks vencedores
 * no formato  "{marketId}:{pick}"  usado pelo settleBet.
 */
function resolveWinners(
  marketId: string,
  marketType: string,
  homeScore: number,
  awayScore: number,
): string[] {
  const winners: string[] = [];

  if (marketType === '1x2') {
    if (homeScore > awayScore) winners.push(`${marketId}:home`);
    else if (awayScore > homeScore) winners.push(`${marketId}:away`);
    else winners.push(`${marketId}:draw`);
  }

  if (marketType === 'over_under') {
    const total = homeScore + awayScore;
    if (total > 2.5) winners.push(`${marketId}:over`);
    else winners.push(`${marketId}:under`);
  }

  return winners;
}

// ─── Serviço principal ────────────────────────────────────────────────────────

export const SettlementService = {
  /**
   * Tenta liquidar todas as apostas pendentes de partidas já encerradas.
   * É seguro rodar em paralelo com o sync de odds — usa SELECT antes de UPDATE.
   */
  async settleFinishedMatches(): Promise<void> {
    const startedAt = Date.now();

    // 1. Partidas finalizadas que têm pelo menos 1 aposta pendente
    const finishedMatches = await db('matches')
      .whereIn('id', function () {
        this.select('match_id')
          .from('bet_selections')
          .whereIn('bet_id', function () {
            this.select('id').from('bets').where('status', 'pending');
          });
      })
      .where('status', 'finished')
      .select('id', 'home_score', 'away_score');

    if (finishedMatches.length === 0) {
      logger.debug('[Settlement] nenhuma partida finalizada com apostas pendentes');
      return;
    }

    logger.info(
      `[Settlement] ${finishedMatches.length} partida(s) finalizada(s) para liquidar`,
    );

    let settled = 0;
    let errors = 0;

    for (const match of finishedMatches) {
      // 2. Apostas pendentes com seleções nesta partida
      const pendingBets = await db('bets')
        .where('status', 'pending')
        .whereIn('id', function () {
          this.select('bet_id')
            .from('bet_selections')
            .where('match_id', match.id);
        })
        .select('id');

      // 3. Mercados ativos desta partida (para saber os IDs reais dos mercados)
      const markets = await db('markets')
        .where('match_id', match.id)
        .where('is_active', true)
        .select('id', 'type');

      // 4. Montar lista de picks vencedores para todos os mercados desta partida
      const winnerPickIds: string[] = [];
      for (const market of markets) {
        const winners = resolveWinners(
          market.id,
          market.type,
          Number(match.home_score),
          Number(match.away_score),
        );
        winnerPickIds.push(...winners);
      }

      if (winnerPickIds.length === 0) {
        logger.warn(
          `[Settlement] partida ${match.id} sem mercados resolvíveis — pulando`,
        );
        continue;
      }

      // 5. Liquidar cada aposta
      for (const bet of pendingBets) {
        try {
          await BetService.settleBet(bet.id, winnerPickIds);
          settled++;
        } catch (err: any) {
          // BetAlreadySettledError: aposta já foi resolvida por outro processo
          if (err?.name === 'BetAlreadySettledError') continue;
          logger.error(`[Settlement] erro ao liquidar aposta ${bet.id}: ${err?.message ?? err}`);
          errors++;
        }
      }
    }

    logger.info(
      `[Settlement] concluído em ${Date.now() - startedAt}ms ` +
        `— ${settled} aposta(s) liquidada(s), ${errors} erro(s)`,
    );
  },

  /**
   * Inicia o agendamento periódico do settlement.
   * Roda a cada `intervalMs` milissegundos (padrão: 5 minutos).
   * Também executa uma passagem imediata na inicialização.
   */
  startScheduler(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
    // Passagem imediata ao iniciar
    this.settleFinishedMatches().catch((err) =>
      logger.error('[Settlement] erro na passagem inicial:', err),
    );

    const timer = setInterval(() => {
      this.settleFinishedMatches().catch((err) =>
        logger.error('[Settlement] erro no scheduler:', err),
      );
    }, intervalMs);

    logger.info(
      `[Settlement] scheduler iniciado — intervalo: ${intervalMs / 1000}s`,
    );

    return timer;
  },
};
