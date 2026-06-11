import { db } from '../config/database.js';
import type { User, UserPublic, PaginationParams, PaginationResult } from '../types/index.js';

const TABLE = 'users';

function toPublic(user: User): UserPublic {
  const { password_hash, cpf, ...pub } = user;
  return pub;
}

export const UserRepository = {
  async findById(id: string): Promise<User | undefined> {
    return db<User>(TABLE).where({ id }).first();
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return db<User>(TABLE).where({ email }).first();
  },

  async findByCpf(cpf: string): Promise<User | undefined> {
    return db<User>(TABLE).where({ cpf }).first();
  },

  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const [user] = await db<User>(TABLE)
      .insert({ ...data })
      .returning('*');
    return user;
  },

  async update(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db<User>(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return user;
  },

  async updateBalance(id: string, amount: number, trx?: any): Promise<User> {
    const query = (trx || db)<User>(TABLE)
      .where({ id })
      .update({
        balance: db.raw('balance + ?', [amount]),
        updated_at: new Date(),
      })
      .returning('*');

    const [user] = await query;
    return user;
  },

  async findAll(params: PaginationParams): Promise<PaginationResult<UserPublic>> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const [{ count }] = await db(TABLE).count('id as count');
    const users = await db<User>(TABLE)
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    return {
      data: users.map(toPublic),
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  },

  toPublic,
};
