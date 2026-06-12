/**
 * PlayFiverCallbackService
 *
 * Processa os callbacks que a PlayFiver envia para o BetForge durante
 * uma sessão de jogo. São três ações possíveis:
 *
 *  debit    — PlayFiver quer debitar da carteira do usuário (aposta)
 *  credit   — PlayFiver quer creditar na carteira do usuário (ganho)
 *  rollback — Cancela uma transação anterior (ex: timeout de rodada)
 *
 * A PlayFiver espera como resposta o transaction_id gerado pelo BetForge
 * e o saldo atual do usuário em centavos (integer).
 *
 * IDEMPOTÊNCIA: se transaction_id já existe, retorna sucesso sem duplicar.
 */

import { db } from '../config/database.js';
import { UserRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { v4 as uuid } from 'uuid';
import type { PFCallbackPayload, PFCallbackResponse } from './playfiver.service.js';

// Converte reais para centavos e vice-versa
const toBRL   = (cents: number) => cents / 100;
const toCents = (brl: number)   => Math.round(brl * 100);

export const PlayFiverCallbackService = {

  async handle(payload: PFCallbackPayload): Promise<PFCallbackResponse> {
    const { action, player_id, transaction_id, amount, round_id, game_id } = payload;

    logger.info('[PlayFiver Callback]', { action, player_id, transaction_id, amount });

    // ─── Idempotência ───────────────────────────────────────────────────────────
    const existing = await db('playfiver_transactions')
      .where({ external_transaction_id: transaction_id })
      .first();

    if (existing) {
      logger.info('[PlayFiver Callback] Transação já processada — retornando cached', { transaction_id });
      const user = await UserRepository.findById(player_id);
      return {
        transaction_id: existing.id,
        balance: toCents(Number(user?.balance ?? 0)),
        currency: 'BRL',
      };
    }

    // ─── Buscar usuário ─────────────────────────────────────────────────────────
    const user = await UserRepository.findById(player_id);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    const amountBRL = toBRL(amount);

    return db.transaction(async (trx) => {
      let balanceDelta = 0;
      let txType: string;

      switch (action) {
        case 'debit': {
          // Verifica saldo suficiente
          if (Number(user.balance) < amountBRL) {
            throw new AppError('Saldo insuficiente', 402, 'INSUFFICIENT_BALANCE');
          }
          balanceDelta = -amountBRL;
          txType = 'casino_bet';
          break;
        }

        case 'credit': {
          balanceDelta = amountBRL;
          txType = 'casino_win';
          break;
        }

        case 'rollback': {
          // Reverte a transação referenciada
          const original = await trx('playfiver_transactions')
            .where({ external_transaction_id: payload.reference_id })
            .first();

          if (!original) {
            // Rollback de algo que não existe — PlayFiver aceita como OK
            logger.warn('[PlayFiver Callback] rollback sem transação original', payload);
            const internalId = uuid();
            await trx('playfiver_transactions').insert({
              id: internalId,
              user_id: player_id,
              game_id,
              round_id,
              action: 'rollback',
              amount: 0,
              balance_before: toCents(Number(user.balance)),
              balance_after: toCents(Number(user.balance)),
              external_transaction_id: transaction_id,
              status: 'no_op',
              created_at: new Date(),
            });
            return { transaction_id: internalId, balance: toCents(Number(user.balance)), currency: 'BRL' };
          }

          // Inverte o delta da transação original
          balanceDelta = original.action === 'debit' ? toBRL(original.amount) : -toBRL(original.amount);
          txType = 'casino_rollback';
          break;
        }

        default:
          throw new AppError(`Ação desconhecida: ${action}`, 400, 'UNKNOWN_ACTION');
      }

      // Atualiza saldo do usuário
      const balanceBefore = toCents(Number(user.balance));
      const updatedUser = await UserRepository.updateBalance(player_id, balanceDelta, trx);
      const balanceAfter = toCents(Number(updatedUser.balance));

      // Registra na tabela de transações PlayFiver
      const internalId = uuid();
      await trx('playfiver_transactions').insert({
        id: internalId,
        user_id: player_id,
        game_id,
        round_id,
        action,
        amount,             // centavos, como veio da PlayFiver
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        external_transaction_id: transaction_id,
        status: 'completed',
        created_at: new Date(),
      });

      // Registra também na tabela de transações financeiras do BetForge
      await trx('transactions').insert({
        id: uuid(),
        user_id: player_id,
        type: txType,
        status: 'completed',
        amount: Math.abs(amountBRL),
        metadata: JSON.stringify({ game_id, round_id, pf_tx_id: transaction_id }),
        processed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('[PlayFiver Callback] Transação processada', {
        internalId, action, player_id, amountBRL, balanceAfter,
      });

      return { transaction_id: internalId, balance: balanceAfter, currency: 'BRL' };
    });
  },
};
