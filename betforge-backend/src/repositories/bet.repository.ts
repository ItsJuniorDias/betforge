import { db } from "../config/database.js";
import type {
  Bet,
  BetSelection,
  PaginationParams,
  PaginationResult,
} from "../types/index.js";

const BETS_TABLE = "bets";
const SELECTIONS_TABLE = "bet_selections";

export const BetRepository = {
  async findById(id: string): Promise<Bet | undefined> {
    const bet = await db<Bet>(BETS_TABLE).where({ id }).first();
    if (!bet) return undefined;

    const selections = await db<BetSelection>(SELECTIONS_TABLE).where({
      bet_id: id,
    });
    return { ...bet, selections };
  },

  async findByUserId(
    userId: string,
    params: PaginationParams & { status?: string },
  ): Promise<PaginationResult<Bet>> {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    const query = db<Bet>(BETS_TABLE).where({ user_id: userId });
    if (status) query.andWhere({ status });

    const countResult = await query.clone().count("id as count");
    const count = (countResult[0] as unknown as { count: string | number })
      .count;

    const bets = await query
      .clone()
      .select()
      .limit(limit)
      .offset(offset)
      .orderBy("created_at", "desc");

    const betsWithSelections = await Promise.all(
      bets.map(async (bet) => {
        const selections = await db<BetSelection>(SELECTIONS_TABLE).where({
          bet_id: bet.id,
        });
        return { ...bet, selections };
      }),
    );

    return {
      data: betsWithSelections,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  },

  async create(
    bet: Omit<Bet, "id" | "created_at" | "updated_at" | "selections">,
    selections: Omit<BetSelection, "id" | "bet_id" | "created_at">[],
    trx: any,
  ): Promise<Bet> {
    const conn = trx as typeof db;
    const [created] = await conn<Bet>(BETS_TABLE).insert(bet).returning("*");

    const selsWithBetId = selections.map((s) => ({ ...s, bet_id: created.id }));
    const createdSels = await conn<BetSelection>(SELECTIONS_TABLE)
      .insert(selsWithBetId)
      .returning("*");

    return { ...created, selections: createdSels };
  },

  async settle(
    id: string,
    status: Bet["status"],
    actualPayout: number,
    trx: any,
  ): Promise<Bet> {
    const conn = trx as typeof db;
    const [bet] = await conn<Bet>(BETS_TABLE)
      .where({ id })
      .update({
        status,
        actual_payout: actualPayout,
        settled_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");
    return bet;
  },

  async countByUser(userId: string): Promise<Record<string, number>> {
    const rows = await db(BETS_TABLE)
      .where({ user_id: userId })
      .groupBy("status")
      .select("status")
      .count("id as count");

    return rows.reduce(
      (acc, r) => ({ ...acc, [r.status as string]: Number(r.count) }),
      {} as any,
    ) as Record<string, number>;
  },
};
