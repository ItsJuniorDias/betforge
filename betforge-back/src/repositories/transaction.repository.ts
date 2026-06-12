import { db } from '../config/database.js';
import type {
  Transaction,
  PaginationParams,
  PaginationResult,
} from '../types/index.js';

const TABLE = 'transactions';

/** Dias de carência após um depósito antes de liberar o saque */
export const WITHDRAW_LOCK_DAYS = 3;

export const TransactionRepository = {
  async findById(id: string): Promise<Transaction | undefined> {
    return db<Transaction>(TABLE).where({ id }).first();
  },

  async findByExternalId(externalId: string): Promise<Transaction | undefined> {
    return db<Transaction>(TABLE).where({ external_id: externalId }).first();
  },

  async findByUserId(
    userId: string,
    params: PaginationParams & { type?: string },
  ): Promise<PaginationResult<Transaction>> {
    const { page, limit, type } = params;
    const offset = (page - 1) * limit;

    const query = db<Transaction>(TABLE).where({ user_id: userId });
    if (type) query.andWhere({ type });

    const countResult = await query.clone().count('id as count');
    const count = (countResult[0] as unknown as { count: string | number }).count;

    const data = await query
      .clone()
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    return {
      data,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  },

  async create(
    data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
    trx?: any,
  ): Promise<Transaction> {
    const conn = (trx || db) as typeof db;
    const [tx] = await conn<Transaction>(TABLE).insert(data).returning('*');
    return tx;
  },

  async updateStatus(
    id: string,
    status: Transaction['status'],
    processedAt?: Date,
    trx?: any,
  ): Promise<Transaction> {
    const conn = (trx || db) as typeof db;
    const [tx] = await conn<Transaction>(TABLE)
      .where({ id })
      .update({ status, processed_at: processedAt, updated_at: new Date() })
      .returning('*');
    return tx;
  },

  async updateExternalId(id: string, externalId: string, trx?: any): Promise<void> {
    const conn = (trx || db) as typeof db;
    await conn<Transaction>(TABLE)
      .where({ id })
      .update({ external_id: externalId, updated_at: new Date() });
  },

  /**
   * Após confirmação de depósito: marca o withdraw_available_at para
   * daqui a WITHDRAW_LOCK_DAYS dias.
   */
  async setWithdrawAvailableAt(id: string, availableAt: Date, trx?: any): Promise<void> {
    const conn = (trx || db) as typeof db;
    await conn<Transaction>(TABLE)
      .where({ id })
      .update({ withdraw_available_at: availableAt, updated_at: new Date() });
  },

  async sumByUserAndType(userId: string, type: string): Promise<number> {
    const [{ total }] = await db(TABLE)
      .where({ user_id: userId, type, status: 'completed' })
      .sum('amount as total');
    return Number(total) || 0;
  },

  /**
   * Calcula o saldo disponível para saque:
   * = soma dos depósitos confirmados cujo período de carência já terminou
   * - soma dos saques completados ou pendentes
   *
   * Retorna um valor que nunca ultrapassa o balance real do usuário.
   */
  async getWithdrawableBalance(userId: string): Promise<number> {
    const now = new Date();

    // Depósitos liberados (carência vencida)
    const [depositRow] = await db(TABLE)
      .where({ user_id: userId, type: 'deposit', status: 'completed' })
      .andWhere('withdraw_available_at', '<=', now)
      .sum('amount as total');

    const totalDeposited = Number((depositRow as any).total) || 0;

    // Saques já efetuados ou pendentes (debita do disponível)
    const [withdrawRow] = await db(TABLE)
      .where({ user_id: userId, type: 'withdraw' })
      .whereIn('status', ['completed', 'pending'])
      .sum('amount as total');

    const totalWithdrawn = Number((withdrawRow as any).total) || 0;

    // Ganhos de apostas (bet_win) e bônus também são sacáveis imediatamente
    const [winRow] = await db(TABLE)
      .where({ user_id: userId, status: 'completed' })
      .whereIn('type', ['bet_win', 'bet_refund', 'bonus'])
      .sum('amount as total');

    const totalWins = Number((winRow as any).total) || 0;

    const withdrawable = totalDeposited + totalWins - totalWithdrawn;
    return Math.max(0, withdrawable);
  },

  /**
   * Retorna os depósitos ainda em carência (para exibir ao usuário).
   * Campos retornados: id, amount, created_at, withdraw_available_at
   */
  async getLockedDeposits(userId: string) {
    const now = new Date();
    return db(TABLE)
      .select('id', 'amount', 'created_at', 'withdraw_available_at')
      .where({ user_id: userId, type: 'deposit', status: 'completed' })
      .andWhere('withdraw_available_at', '>', now)
      .orderBy('withdraw_available_at', 'asc');
  },
};
