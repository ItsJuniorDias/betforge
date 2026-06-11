import { db } from '../config/database.js';
import type { Transaction, PaginationParams, PaginationResult } from '../types/index.js';

const TABLE = 'transactions';

export const TransactionRepository = {
  async findById(id: string): Promise<Transaction | undefined> {
    return db<Transaction>(TABLE).where({ id }).first();
  },

  async findByUserId(
    userId: string,
    params: PaginationParams & { type?: string }
  ): Promise<PaginationResult<Transaction>> {
    const { page, limit, type } = params;
    const offset = (page - 1) * limit;

    const query = db<Transaction>(TABLE).where({ user_id: userId });
    if (type) query.andWhere({ type });

    const [{ count }] = await query.clone().count('id as count');
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
    trx?: any
  ): Promise<Transaction> {
    const [tx] = await (trx || db)<Transaction>(TABLE).insert(data).returning('*');
    return tx;
  },

  async updateStatus(
    id: string,
    status: Transaction['status'],
    processedAt?: Date,
    trx?: any
  ): Promise<Transaction> {
    const [tx] = await (trx || db)<Transaction>(TABLE)
      .where({ id })
      .update({ status, processed_at: processedAt, updated_at: new Date() })
      .returning('*');
    return tx;
  },

  async sumByUserAndType(userId: string, type: string): Promise<number> {
    const [{ total }] = await db(TABLE)
      .where({ user_id: userId, type, status: 'completed' })
      .sum('amount as total');
    return Number(total) || 0;
  },
};
