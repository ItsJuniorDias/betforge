import { db } from '../config/database.js';
import { BetRepository } from '../repositories/bet.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import {
  NotFoundError,
  InsufficientBalanceError,
  BetAlreadySettledError,
  AppError,
} from '../utils/errors.js';
import type { Bet, BetSelection, PaginationParams } from '../types/index.js';

interface PlaceBetSelectionDTO {
  matchId: string;
  marketId: string;
  pick: string;
  label: string;
  odd: number;
  matchLabel: string;
  marketLabel: string;
}

interface PlaceBetDTO {
  userId: string;
  type: 'single' | 'multiple';
  stake: number;
  selections: PlaceBetSelectionDTO[];
}

export const BetService = {
  async placeBet(dto: PlaceBetDTO): Promise<Bet> {
    const { userId, type, stake, selections } = dto;

    if (selections.length === 0) {
      throw new AppError('Adicione ao menos uma seleção para apostar');
    }

    if (type === 'single' && selections.length !== 1) {
      throw new AppError('Aposta simples deve ter exatamente uma seleção');
    }

    if (type === 'multiple' && selections.length < 2) {
      throw new AppError('Aposta múltipla deve ter ao menos 2 seleções');
    }

    if (stake < 1) {
      throw new AppError('O valor mínimo de aposta é R$ 1,00');
    }

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    if (user.balance < stake) {
      throw new InsufficientBalanceError(`Saldo insuficiente. Saldo atual: R$ ${user.balance.toFixed(2)}`);
    }

    // Validar odds (prevenção de manipulação)
    for (const sel of selections) {
      if (sel.odd < 1.01 || sel.odd > 1000) {
        throw new AppError(`Odd inválida para a seleção: ${sel.label}`);
      }
    }

    const totalOdd = selections.reduce((acc, s) => acc * s.odd, 1);
    const potentialPayout = parseFloat((stake * totalOdd).toFixed(2));

    return db.transaction(async (trx) => {
      // 1. Debitar saldo do usuário
      await UserRepository.updateBalance(userId, -stake, trx);

      // 2. Registrar transação de débito
      await TransactionRepository.create(
        {
          user_id: userId,
          type: 'bet_stake',
          status: 'completed',
          amount: stake,
          processed_at: new Date(),
          metadata: { type, selectionsCount: selections.length },
        },
        trx
      );

      // 3. Criar a aposta
      const betData: Omit<Bet, 'id' | 'created_at' | 'updated_at' | 'selections'> = {
        user_id: userId,
        type,
        status: 'pending',
        stake,
        potential_payout: potentialPayout,
        total_odd: parseFloat(totalOdd.toFixed(4)),
      };

      const selectionData: Omit<BetSelection, 'id' | 'bet_id' | 'created_at'>[] =
        selections.map((s) => ({
          match_id: s.matchId,
          market_id: s.marketId,
          pick: s.pick,
          label: s.label,
          odd: s.odd,
          status: 'pending',
          match_label: s.matchLabel,
          market_label: s.marketLabel,
        }));

      const bet = await BetRepository.create(betData, selectionData, trx);
      return bet;
    });
  },

  async getUserBets(userId: string, params: PaginationParams & { status?: string }) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    return BetRepository.findByUserId(userId, params);
  },

  async getBetById(betId: string, userId: string): Promise<Bet> {
    const bet = await BetRepository.findById(betId);
    if (!bet) throw new NotFoundError('Aposta não encontrada');

    // Apenas o dono ou admin pode ver a aposta
    if (bet.user_id !== userId) {
      throw new NotFoundError('Aposta não encontrada');
    }

    return bet;
  },

  async settleBet(betId: string, winnerPickIds: string[]): Promise<Bet> {
    const bet = await BetRepository.findById(betId);
    if (!bet) throw new NotFoundError('Aposta não encontrada');
    if (bet.status !== 'pending') throw new BetAlreadySettledError();

    return db.transaction(async (trx) => {
      // Determinar status de cada seleção
      let allWon = true;
      let anyLost = false;

      for (const sel of bet.selections!) {
        const won = winnerPickIds.includes(`${sel.market_id}:${sel.pick}`);
        if (!won) allWon = false;
        if (!won) anyLost = true;

        await trx('bet_selections')
          .where({ id: sel.id })
          .update({ status: won ? 'won' : 'lost' });
      }

      const betStatus: Bet['status'] = allWon ? 'won' : 'lost';
      const actualPayout = allWon ? bet.potential_payout : 0;

      const settled = await BetRepository.settle(betId, betStatus, actualPayout, trx);

      // Se ganhou, creditar o pagamento
      if (allWon && actualPayout > 0) {
        await UserRepository.updateBalance(bet.user_id, actualPayout, trx);
        await TransactionRepository.create(
          {
            user_id: bet.user_id,
            type: 'bet_win',
            status: 'completed',
            amount: actualPayout,
            processed_at: new Date(),
            metadata: { bet_id: betId },
          },
          trx
        );
      }

      return settled;
    });
  },

  async getUserStats(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const counts = await BetRepository.countByUser(userId);
    const totalDeposited = await TransactionRepository.sumByUserAndType(userId, 'deposit');
    const totalWithdrawn = await TransactionRepository.sumByUserAndType(userId, 'withdraw');
    const totalWon = await TransactionRepository.sumByUserAndType(userId, 'bet_win');
    const totalStaked = await TransactionRepository.sumByUserAndType(userId, 'bet_stake');

    const totalBets = (counts.won || 0) + (counts.lost || 0) + (counts.pending || 0);
    const winRate = totalBets > 0
      ? Math.round(((counts.won || 0) / (totalBets - (counts.pending || 0))) * 100)
      : 0;

    return {
      balance: user.balance,
      bonusBalance: user.bonus_balance,
      totalBets,
      wonBets: counts.won || 0,
      lostBets: counts.lost || 0,
      pendingBets: counts.pending || 0,
      totalStaked,
      totalWon,
      totalDeposited,
      totalWithdrawn,
      profitLoss: parseFloat((totalWon - totalStaked).toFixed(2)),
      winRate,
    };
  },
};
