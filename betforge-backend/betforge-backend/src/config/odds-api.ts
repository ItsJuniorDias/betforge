/**
 * Cliente HTTP para a The Odds API (https://the-odds-api.com)
 *
 * Endpoints usados:
 *   GET /v4/sports/{sport}/odds    — odds de jogos futuros + ao vivo
 *   GET /v4/sports/{sport}/scores  — placares ao vivo / recentes
 */

import { env } from './env.js';
import { logger } from '../utils/logger.js';

const BASE_URL = 'https://api.the-odds-api.com/v4';

// ─── Tipos brutos retornados pela The Odds API ────────────────────────────────

export interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Array<{
    key: string;
    last_update: string;
    outcomes: OddsApiOutcome[];
  }>;
}

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  last_update: string | null;
  home_team: string;
  away_team: string;
  scores: Array<{ name: string; score: string }> | null;
}

// ─── Fetch helper com log de créditos ────────────────────────────────────────

async function oddsApiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('apiKey', env.ODDS_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());

  const remaining = res.headers.get('x-requests-remaining');
  const used      = res.headers.get('x-requests-used');
  if (remaining) {
    logger.debug(`[OddsAPI] créditos restantes: ${remaining} (usados: ${used})`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OddsAPI ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Sport keys válidos ───────────────────────────────────────────────────────
// Removidos:
//   soccer_brazil_copa_do_brasil          → retorna 404 UNKNOWN_SPORT nesta chave
//   basketball_nba_championship_winner    → retorna 422 INVALID_MARKET_COMBO
//     (é um mercado de outrights/futures, não aceita h2h+totals)

export const SPORT_KEYS = {
  football: [
    'soccer_brazil_campeonato',       // Brasileirão
    'soccer_uefa_champs_league',      // Champions League
    'soccer_epl',                     // Premier League
    'soccer_spain_la_liga',           // La Liga
    'soccer_italy_serie_a',           // Serie A
    'soccer_germany_bundesliga',      // Bundesliga
    'soccer_conmebol_copa_libertadores', // Libertadores
  ],
  basketball: [
    'basketball_nba',                 // NBA (partidas regulares + playoffs)
  ],
} as const;

export const ALL_SPORT_KEYS = [
  ...SPORT_KEYS.football,
  ...SPORT_KEYS.basketball,
];

export function toInternalSport(sportKey: string): 'football' | 'basketball' {
  if (sportKey.startsWith('soccer_'))     return 'football';
  if (sportKey.startsWith('basketball_')) return 'basketball';
  return 'football';
}

export const LEAGUE_MAP: Record<string, { id: string; label: string; flag: string }> = {
  soccer_brazil_campeonato:              { id: 'brasileirao',  label: 'Brasileirão',       flag: '🇧🇷' },
  soccer_uefa_champs_league:             { id: 'champions',    label: 'Champions League',  flag: '🏆' },
  soccer_epl:                            { id: 'premier',      label: 'Premier League',    flag: '🏴' },
  soccer_spain_la_liga:                  { id: 'laliga',       label: 'La Liga',           flag: '🇪🇸' },
  soccer_italy_serie_a:                  { id: 'seriea',       label: 'Serie A',           flag: '🇮🇹' },
  soccer_germany_bundesliga:             { id: 'bundesliga',   label: 'Bundesliga',        flag: '🇩🇪' },
  soccer_conmebol_copa_libertadores:     { id: 'libertadores', label: 'Libertadores',      flag: '🏆' },
  basketball_nba:                        { id: 'nba',          label: 'NBA',               flag: '🏀' },
};

// ─── Chamadas públicas ────────────────────────────────────────────────────────

export const OddsApiClient = {
  async getOdds(sportKey: string): Promise<OddsApiEvent[]> {
    return oddsApiFetch<OddsApiEvent[]>(`/sports/${sportKey}/odds`, {
      regions: 'eu',
      markets: 'h2h,totals',
      oddsFormat: 'decimal',
    });
  },

  async getScores(sportKey: string): Promise<OddsApiScore[]> {
    return oddsApiFetch<OddsApiScore[]>(`/sports/${sportKey}/scores`, {
      daysFrom: '1',
    });
  },

  async listSports() {
    return oddsApiFetch<Array<{ key: string; title: string; active: boolean }>>('/sports');
  },
};
