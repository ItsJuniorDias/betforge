import { db } from '../config/database.js';
import type { Match, Market, Odd, Sport } from '../types/index.js';

export interface GameOdds {
  homeOdd: number | null;
  drawOdd: number | null;
  awayOdd: number | null;
  homeLabel: string;
  awayLabel: string;
}

export interface GameSummary {
  id: string;
  sport: Sport;
  league_id: string;
  league_label: string;
  league_flag: string;
  round: string;
  home_team: string;
  away_team: string;
  home_emoji: string;
  away_emoji: string;
  home_score: number;
  away_score: number;
  status: string;
  starts_at: string;
  minute: number | null;
  period: string | null;
  isLive: boolean;
  time: string | null;
  homeOdd: number | null;
  drawOdd: number | null;
  awayOdd: number | null;
  markets: number;
}

export interface GameDetail extends GameSummary {
  markets_detail: MarketWithOdds[];
}

export interface MarketWithOdds {
  id: string;
  label: string;
  type: string;
  picks: Array<{
    id: string;
    pick: string;
    label: string;
    odd: number;
  }>;
}

// Formata data para exibição no frontend
function formatTime(startsAt: Date): string {
  const now = new Date();
  const diff = startsAt.getTime() - now.getTime();
  const diffHours = diff / (1000 * 60 * 60);
  const diffDays = diff / (1000 * 60 * 60 * 24);

  if (diffHours < 0) return 'Em breve';

  if (diffHours < 24) {
    const timeStr = startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    return `Hoje · ${timeStr}`;
  }

  if (diffDays < 2) {
    const timeStr = startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    return `Amanhã · ${timeStr}`;
  }

  const weekday = startsAt.toLocaleDateString('pt-BR', {
    weekday: 'short',
    timeZone: 'America/Sao_Paulo',
  });
  const timeStr = startsAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1, 3)} · ${timeStr}`;
}

// Extrai as odds 1x2 principais de um jogo (melhor odd por pick)
async function get1x2Odds(matchId: string): Promise<GameOdds & { homeLabel: string; awayLabel: string }> {
  const rows = await db('markets')
    .join('odds', 'odds.market_id', 'markets.id')
    .where('markets.match_id', matchId)
    .where('markets.type', '1x2')
    .where('markets.is_active', true)
    .where('odds.is_active', true)
    .select('odds.pick', 'odds.value', 'odds.label')
    .orderBy('odds.value', 'desc'); // best odds first

  let homeOdd: number | null = null;
  let drawOdd: number | null = null;
  let awayOdd: number | null = null;
  let homeLabel = '';
  let awayLabel = '';

  for (const row of rows) {
    const pick = row.pick as string;
    const value = parseFloat(row.value);
    if (pick === 'home' && homeOdd === null) {
      homeOdd = value;
      homeLabel = row.label;
    } else if (pick === 'draw' && drawOdd === null) {
      drawOdd = value;
    } else if (pick === 'away' && awayOdd === null) {
      awayOdd = value;
      awayLabel = row.label;
    }
  }

  return { homeOdd, drawOdd, awayOdd, homeLabel, awayLabel };
}

// Conta total de mercados ativos de uma partida
async function countMarkets(matchId: string): Promise<number> {
  const [{ count }] = await db('markets')
    .where('match_id', matchId)
    .where('is_active', true)
    .count('id as count');
  return parseInt(count as string, 10);
}

// Converte linha do banco para GameSummary
async function toGameSummary(row: any): Promise<GameSummary> {
  const odds = await get1x2Odds(row.id);
  const marketsCount = row.markets_count > 0
    ? row.markets_count
    : await countMarkets(row.id);

  const isLive = row.status === 'live';

  return {
    id: row.id,
    sport: row.sport,
    league_id: row.league_id,
    league_label: row.league_label || row.league_id,
    league_flag: row.league_flag || '🏆',
    round: row.round || '',
    home_team: row.home_team,
    away_team: row.away_team,
    home_emoji: row.home_emoji || '⚽',
    away_emoji: row.away_emoji || '⚽',
    home_score: row.home_score ?? 0,
    away_score: row.away_score ?? 0,
    status: row.status,
    starts_at: row.starts_at instanceof Date
      ? row.starts_at.toISOString()
      : row.starts_at,
    minute: row.minute ?? null,
    period: row.period ?? null,
    isLive,
    time: isLive ? null : formatTime(new Date(row.starts_at)),
    homeOdd: odds.homeOdd,
    drawOdd: odds.drawOdd,
    awayOdd: odds.awayOdd,
    markets: marketsCount,
  };
}

export const GamesService = {
  // GET /api/v1/games — todos os jogos ao vivo + proximos (paginado)
  async listGames(params: {
    sport?: string;
    league?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { sport, league, status, page = 1, limit = 30 } = params;

    const statuses = status ? [status] : ['live', 'scheduled'];

    // Query de contagem separada — sem ORDER BY para evitar erro de agregacao no PostgreSQL
    const countQuery = db('matches').whereIn('status', statuses);
    if (sport)  countQuery.where('sport', sport);
    if (league) countQuery.where('league_id', league);
    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count as string, 10);

    // Query de dados — com ORDER BY para priorizar ao vivo
    const dataQuery = db('matches')
      .whereIn('status', statuses)
      .orderByRaw("CASE WHEN status = 'live' THEN 0 ELSE 1 END")
      .orderBy('starts_at', 'asc')
      .offset((page - 1) * limit)
      .limit(limit);

    if (sport)  dataQuery.where('sport', sport);
    if (league) dataQuery.where('league_id', league);

    const rows = await dataQuery;

    const data = await Promise.all(rows.map(toGameSummary));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // GET /api/v1/games/live — somente ao vivo
  async getLiveGames(sport?: string) {
    const query = db('matches')
      .where('status', 'live')
      .orderBy('created_at', 'asc');

    if (sport) query.where('sport', sport);

    const rows = await query;
    return Promise.all(rows.map(toGameSummary));
  },

  // GET /api/v1/games/:id — detalhe do jogo + todos os mercados
  async getGameById(matchId: string): Promise<GameDetail | null> {
    const row = await db('matches').where('id', matchId).first();
    if (!row) return null;

    const summary = await toGameSummary(row);

    // Buscar todos os mercados e odds
    const markets = await db('markets')
      .where('match_id', matchId)
      .where('is_active', true)
      .orderBy('created_at', 'asc');

    const markets_detail: MarketWithOdds[] = await Promise.all(
      markets.map(async (market) => {
        const picks = await db('odds')
          .where('market_id', market.id)
          .where('is_active', true)
          .orderBy('value', 'desc') // melhores odds primeiro
          .select('id', 'pick', 'label', 'value');

        return {
          id: market.id,
          label: market.label,
          type: market.type,
          picks: picks.map((p) => ({
            id: p.id,
            pick: p.pick,
            label: p.label,
            odd: parseFloat(p.value),
          })),
        };
      })
    );

    return { ...summary, markets_detail };
  },

  // GET /api/v1/games/:id/markets — mercados de um jogo específico
  async getGameMarkets(matchId: string): Promise<MarketWithOdds[]> {
    const game = await db('matches').where('id', matchId).first();
    if (!game) return [];

    const markets = await db('markets')
      .where('match_id', matchId)
      .where('is_active', true)
      .orderBy('created_at', 'asc');

    return Promise.all(
      markets.map(async (market) => {
        const picks = await db('odds')
          .where('market_id', market.id)
          .where('is_active', true)
          .orderBy('value', 'desc')
          .select('id', 'pick', 'label', 'value');

        return {
          id: market.id,
          label: market.label,
          type: market.type,
          picks: picks.map((p) => ({
            id: p.id,
            pick: p.pick,
            label: p.label,
            odd: parseFloat(p.value),
          })),
        };
      })
    );
  },
};
