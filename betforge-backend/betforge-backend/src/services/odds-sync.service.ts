/**
 * OddsSyncService — busca dados reais da The Odds API e sincroniza com o banco.
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  OddsApiClient,
  SPORT_KEYS,
  LEAGUE_MAP,
  toInternalSport,
  type OddsApiEvent,
  type OddsApiScore,
} from '../config/odds-api.js';
import { env } from '../config/env.js';

const CACHE_TTL_MS = (env.ODDS_CACHE_TTL_SECONDS ?? 60) * 1000;

const syncState = {
  lastSyncAt: 0,
  syncing: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultEmoji(sport: string): string {
  return sport === 'basketball' ? '🏀' : '⚽';
}

/**
 * Converte ID da Odds API (32-char hex sem hífens) para UUID com hífens.
 * PostgreSQL aceita ambos, mas usar formato padrão evita edge cases.
 */
function toUUID(id: string): string {
  if (id.includes('-')) return id; // já está no formato correto
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}

function bestH2HOdds(event: OddsApiEvent) {
  let homeOdd: number | null = null;
  let drawOdd: number | null = null;
  let awayOdd: number | null = null;

  for (const bm of event.bookmakers) {
    const h2h = bm.markets.find((m) => m.key === 'h2h');
    if (!h2h) continue;
    for (const outcome of h2h.outcomes) {
      if (outcome.name === event.home_team) {
        if (!homeOdd || outcome.price > homeOdd) homeOdd = outcome.price;
      } else if (outcome.name === event.away_team) {
        if (!awayOdd || outcome.price > awayOdd) awayOdd = outcome.price;
      } else {
        if (!drawOdd || outcome.price > drawOdd) drawOdd = outcome.price;
      }
    }
  }
  return { homeOdd, drawOdd, awayOdd };
}

function bestTotalsOdds(event: OddsApiEvent, line = 2.5) {
  let overOdd: number | null = null;
  let underOdd: number | null = null;

  for (const bm of event.bookmakers) {
    const totals = bm.markets.find((m) => m.key === 'totals');
    if (!totals) continue;
    for (const outcome of totals.outcomes) {
      const pt = outcome.point ?? 0;
      if (Math.abs(pt - line) > 0.01) continue;
      if (outcome.name === 'Over') {
        if (!overOdd || outcome.price > overOdd) overOdd = outcome.price;
      } else if (outcome.name === 'Under') {
        if (!underOdd || outcome.price > underOdd) underOdd = outcome.price;
      }
    }
  }
  return { overOdd, underOdd };
}

// ─── Upsert de um jogo e seus mercados ────────────────────────────────────────

async function upsertMatch(event: OddsApiEvent, scoreMap: Map<string, OddsApiScore>) {
  const league = LEAGUE_MAP[event.sport_key];
  if (!league) return;

  const sport   = toInternalSport(event.sport_key);
  const matchId = toUUID(event.id);   // ← converte para UUID com hífens
  const score   = scoreMap.get(event.id);

  // Status
  let status = 'scheduled';
  const now      = new Date();
  const startsAt = new Date(event.commence_time);

  if (score) {
    if (score.completed) {
      status = 'finished';
    } else if (score.scores && score.scores.length > 0) {
      status = 'live';
    } else if (startsAt <= now) {
      status = 'live';
    }
  } else if (startsAt <= now) {
    status = 'live';
  }

  // Placar
  let homeScore = 0;
  let awayScore = 0;
  if (score?.scores) {
    for (const s of score.scores) {
      if (s.name === event.home_team) homeScore = parseInt(s.score) || 0;
      if (s.name === event.away_team) awayScore = parseInt(s.score) || 0;
    }
  }

  const emoji = defaultEmoji(sport);

  await db('matches')
    .insert({
      id: matchId,
      sport,
      league_id:     league.id,
      league_label:  league.label,
      league_flag:   league.flag,
      round:         '',
      home_team:     event.home_team,
      away_team:     event.away_team,
      home_emoji:    emoji,
      away_emoji:    emoji,
      home_score:    homeScore,
      away_score:    awayScore,
      status,
      starts_at:     startsAt,
      minute:        null,
      period:        null,
      markets_count: 0,
    })
    .onConflict('id')
    .merge({
      home_score:  homeScore,
      away_score:  awayScore,
      status,
      league_label: league.label,
      league_flag:  league.flag,
      home_emoji:   emoji,
      away_emoji:   emoji,
      updated_at:  db.fn.now(),
    });

  // Mercado 1X2
  const h2h = bestH2HOdds(event);
  if (h2h.homeOdd || h2h.awayOdd) {
    await upsertMarket(matchId, '1x2', 'Resultado Final', [
      { pick: 'home', label: event.home_team, value: h2h.homeOdd ?? 1.5 },
      ...(h2h.drawOdd ? [{ pick: 'draw', label: 'Empate', value: h2h.drawOdd }] : []),
      { pick: 'away', label: event.away_team, value: h2h.awayOdd ?? 1.5 },
    ]);
  }

  // Mercado Over/Under 2.5
  const totals = bestTotalsOdds(event, 2.5);
  if (totals.overOdd || totals.underOdd) {
    await upsertMarket(matchId, 'over_under', 'Mais/Menos 2.5', [
      { pick: 'over',  label: 'Mais de 2.5',  value: totals.overOdd  ?? 1.9 },
      { pick: 'under', label: 'Menos de 2.5', value: totals.underOdd ?? 1.9 },
    ]);
  }

  // Atualiza markets_count
  const [{ count }] = await db('markets')
    .where('match_id', matchId)
    .where('is_active', true)
    .count('id as count');

  await db('matches')
    .where('id', matchId)
    .update({ markets_count: parseInt(count as string, 10) });
}

async function upsertMarket(
  matchId: string,
  type: string,
  label: string,
  picks: Array<{ pick: string; label: string; value: number }>,
) {
  let market = await db('markets').where({ match_id: matchId, type }).first();

  if (!market) {
    const marketId = uuidv4();
    await db('markets').insert({ id: marketId, match_id: matchId, label, type, is_active: true });
    market = { id: marketId };
  } else {
    // Garante que o mercado está ativo
    await db('markets').where({ id: market.id }).update({ is_active: true });
  }

  for (const p of picks) {
    const value    = parseFloat(p.value.toFixed(4));
    const existing = await db('odds').where({ market_id: market.id, pick: p.pick }).first();

    if (existing) {
      await db('odds')
        .where({ id: existing.id })
        .update({ value, label: p.label, is_active: true, updated_at: db.fn.now() });
    } else {
      await db('odds').insert({
        id: uuidv4(),
        market_id: market.id,
        pick: p.pick,
        label: p.label,
        value,
        is_active: true,
      });
    }
  }
}

// ─── Serviço principal ────────────────────────────────────────────────────────

export const OddsSyncService = {
  isCacheValid(): boolean {
    return Date.now() - syncState.lastSyncAt < CACHE_TTL_MS;
  },

  async sync(sports: Array<'football' | 'basketball'> = ['football', 'basketball']): Promise<void> {
    if (this.isCacheValid()) {
      logger.debug('[OddsSync] cache válido, pulando sync');
      return;
    }

    if (syncState.syncing) {
      logger.debug('[OddsSync] sync já em andamento, aguardando...');
      await new Promise<void>((resolve) => {
        const t = setInterval(() => {
          if (!syncState.syncing) { clearInterval(t); resolve(); }
        }, 200);
        setTimeout(() => { clearInterval(t); resolve(); }, 10_000);
      });
      return;
    }

    syncState.syncing = true;
    const started = Date.now();

    try {
      const keys: string[] = [];
      if (sports.includes('football'))   keys.push(...SPORT_KEYS.football);
      if (sports.includes('basketball')) keys.push(...SPORT_KEYS.basketball);

      let totalEvents = 0;

      for (const sportKey of keys) {
        try {
          const [events, scores] = await Promise.all([
            OddsApiClient.getOdds(sportKey),
            OddsApiClient.getScores(sportKey).catch(() => [] as OddsApiScore[]),
          ]);

          const scoreMap = new Map(scores.map((s) => [s.id, s]));

          for (const event of events) {
            try {
              await upsertMatch(event, scoreMap);
              totalEvents++;
            } catch (err) {
              logger.warn(`[OddsSync] erro ao fazer upsert do evento ${event.id}: ${err}`);
            }
          }

          logger.info(`[OddsSync] ${sportKey}: ${events.length} jogos sincronizados`);
        } catch (err) {
          logger.warn(`[OddsSync] erro ao buscar ${sportKey}: ${err}`);
        }
      }

      syncState.lastSyncAt = Date.now();
      logger.info(`[OddsSync] sync concluído em ${Date.now() - started}ms — ${totalEvents} eventos`);
    } finally {
      syncState.syncing = false;
    }
  },

  async forceSync(sports?: Array<'football' | 'basketball'>): Promise<void> {
    syncState.lastSyncAt = 0;
    await this.sync(sports);
  },

  getLastSyncAt(): number {
    return syncState.lastSyncAt;
  },
};
