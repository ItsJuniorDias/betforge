import { api } from './api';
import type { ApiSuccess, ApiPaginated } from '../types/api';

// ─── Types (espelha a resposta do GamesService no backend) ───────────────────

export interface GameSummary {
  id: string;
  sport: string;
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

export interface OddPick {
  id: string;
  pick: string;
  label: string;
  odd: number;
}

export interface MarketWithOdds {
  id: string;
  label: string;
  type: string;
  picks: OddPick[];
}

export interface GameDetail extends GameSummary {
  markets_detail: MarketWithOdds[];
}

export interface GamesListParams {
  sport?: string;
  league?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ─── Adapter: converte GameSummary para o shape que o GameCard.jsx espera ────
// Também aplica valores default para odds nulas (garante que botões de odd
// não renderizem "N/D" ou quebrem quando a API retorna null)

export function toGameCardShape(g: GameSummary) {
  return {
    id: g.id,
    league: g.league_label,
    leagueFlag: g.league_flag,
    round: g.round || '',
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    homeEmoji: g.home_emoji || '⚽',
    awayEmoji: g.away_emoji || '⚽',
    homeScore: g.home_score ?? 0,
    awayScore: g.away_score ?? 0,
    minute: g.minute ?? null,
    period: g.period ?? null,
    isLive: g.isLive,
    time: g.time,
    // Odds: mantém null para omitir o botão se realmente não houver odd
    homeOdd: g.homeOdd,
    drawOdd: g.drawOdd,
    awayOdd: g.awayOdd,
    sport: g.sport,
    markets: g.markets ?? 0,
    status: g.status,
    starts_at: g.starts_at,
  };
}

// ─── Adapter para a BettingPage (usa campos snake_case diretos) ───────────────
export function toGameDetailShape(g: GameDetail) {
  return {
    id: g.id,
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    homeEmoji: g.home_emoji || '⚽',
    awayEmoji: g.away_emoji || '⚽',
    homeScore: g.home_score ?? 0,
    awayScore: g.away_score ?? 0,
    homeOdd: g.homeOdd ?? null,
    drawOdd: g.drawOdd ?? null,
    awayOdd: g.awayOdd ?? null,
    league: g.league_label,
    leagueFlag: g.league_flag,
    round: g.round || '',
    isLive: g.isLive,
    minute: g.minute ?? null,
    period: g.period ?? null,
    time: g.time,
    sport: g.sport,
    markets: g.markets ?? 0,
    // Mercados completos vindos da API (1x2 + over/under reais)
    markets_detail: (g.markets_detail ?? []).map((m) => ({
      id: m.id,
      label: m.label,
      type: m.type,
      picks: m.picks.map((p) => ({
        id: p.id,
        pick: p.pick,
        label: p.label,
        odd: p.odd,
      })),
    })),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const gamesService = {
  async listGames(params: GamesListParams = {}) {
    const { data } = await api.get<ApiPaginated<GameSummary>>('/games', { params });
    return { data: data.data, meta: data.meta };
  },

  async getLiveGames(sport?: string) {
    const { data } = await api.get<ApiSuccess<GameSummary[]>>('/games/live', {
      params: sport ? { sport } : undefined,
    });
    return data.data;
  },

  async getGameById(id: string): Promise<GameDetail> {
    const { data } = await api.get<ApiSuccess<GameDetail>>(`/games/${id}`);
    return data.data;
  },

  async getGameMarkets(id: string): Promise<MarketWithOdds[]> {
    const { data } = await api.get<ApiSuccess<MarketWithOdds[]>>(`/games/${id}/markets`);
    return data.data;
  },
};
