import { db } from "../config/database.js";
import type {
  Transaction,
  PaginationParams,
  PaginationResult,
} from "../types/index.js";

const TABLE = "transactions";

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

    const countResult = await query.clone().count("id as count");
    const count = (countResult[0] as unknown as { count: string | number }).count;

    const data = await query
      .clone()
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    return {
      data,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  },

  async create(
    data: Omit<Transaction, "id" | "created_at" | "updated_at">,
    trx?: any,
  ): Promise<Transaction> {
    const conn = (trx || db) as typeof db;
    const [tx] = await conn<Transaction>(TABLE).insert(data).returning("*");
    return tx;
  },

  async updateStatus(
    id: string,
    status: Transaction["status"],
    processedAt?: Date,
    trx?: any,
  ): Promise<Transaction> {
    const conn = (trx || db) as typeof db;
    const [tx] = await conn<Transaction>(TABLE)
      .where({ id })
      .update({ status, processed_at: processedAt, updated_at: new Date() })
      .returning("*");
    return tx;
  },

  async updateExternalId(id: string, externalId: string, trx?: any): Promise<void> {
    const conn = (trx || db) as typeof db;
    await conn<Transaction>(TABLE)
      .where({ id })
      .update({ external_id: externalId, updated_at: new Date() });
  },

  async sumByUserAndType(userId: string, type: string): Promise<number> {
    const [{ total }] = await db(TABLE)
      .where({ user_id: userId, type, status: "completed" })
      .sum("amount as total");
    return Number(total) || 0;
  },
};
