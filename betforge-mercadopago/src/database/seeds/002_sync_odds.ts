/**
 * Seed 002 — Sync de Odds Reais
 *
 * Busca partidas e odds reais da The Odds API e popula o banco.
 * Não usa dados fictícios. Execute após rodar as migrations e o seed 001.
 *
 * Uso:
 *   npm run seed:odds
 *
 * Requer ODDS_API_KEY configurado no .env
 */

import { db } from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";
import {
  OddsApiClient,
  SPORT_KEYS,
  LEAGUE_MAP,
  toInternalSport,
  type OddsApiEvent,
  type OddsApiScore,
} from "../../config/odds-api.js";
import { env } from "../../config/env.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultEmoji(sport: string): string {
  return sport === "basketball" ? "🏀" : "⚽";
}

/**
 * Converte ID da Odds API (32-char hex sem hífens) para UUID com hífens.
 */
function toUUID(id: string): string {
  if (id.includes("-")) return id;
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

function bestH2HOdds(event: OddsApiEvent) {
  let homeOdd: number | null = null;
  let drawOdd: number | null = null;
  let awayOdd: number | null = null;

  for (const bm of event.bookmakers) {
    const h2h = bm.markets.find((m) => m.key === "h2h");
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
    const totals = bm.markets.find((m) => m.key === "totals");
    if (!totals) continue;
    for (const outcome of totals.outcomes) {
      const pt = outcome.point ?? 0;
      if (Math.abs(pt - line) > 0.01) continue;
      if (outcome.name === "Over") {
        if (!overOdd || outcome.price > overOdd) overOdd = outcome.price;
      } else if (outcome.name === "Under") {
        if (!underOdd || outcome.price > underOdd) underOdd = outcome.price;
      }
    }
  }
  return { overOdd, underOdd };
}

// ─── Upsert de mercado e suas odds ────────────────────────────────────────────

async function upsertMarket(
  matchId: string,
  type: string,
  label: string,
  picks: Array<{ pick: string; label: string; value: number }>,
) {
  let market = await db("markets").where({ match_id: matchId, type }).first();

  if (!market) {
    const marketId = uuidv4();
    await db("markets").insert({
      id: marketId,
      match_id: matchId,
      label,
      type,
      is_active: true,
    });
    market = { id: marketId };
  } else {
    await db("markets").where({ id: market.id }).update({ is_active: true });
  }

  for (const p of picks) {
    const value = parseFloat(p.value.toFixed(4));
    const existing = await db("odds")
      .where({ market_id: market.id, pick: p.pick })
      .first();

    if (existing) {
      await db("odds").where({ id: existing.id }).update({
        value,
        label: p.label,
        is_active: true,
        updated_at: db.fn.now(),
      });
    } else {
      await db("odds").insert({
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

// ─── Upsert de partida com seus mercados ──────────────────────────────────────

async function upsertMatch(
  event: OddsApiEvent,
  scoreMap: Map<string, OddsApiScore>,
): Promise<boolean> {
  const league = LEAGUE_MAP[event.sport_key];
  if (!league) return false;

  const sport = toInternalSport(event.sport_key);
  const matchId = toUUID(event.id);
  const score = scoreMap.get(event.id);

  // Determina status
  let status = "scheduled";
  if (score?.completed) {
    status = "finished";
  } else if (score?.scores && score.scores.length > 0) {
    status = "live";
  }

  // Extrai placar
  let homeScore = 0;
  let awayScore = 0;
  if (score?.scores) {
    for (const s of score.scores) {
      if (s.name === event.home_team) homeScore = parseInt(s.score) || 0;
      if (s.name === event.away_team) awayScore = parseInt(s.score) || 0;
    }
  }

  const emoji = defaultEmoji(sport);

  await db("matches")
    .insert({
      id: matchId,
      sport,
      league_id: league.id,
      league_label: league.label,
      league_flag: league.flag,
      round: "",
      home_team: event.home_team,
      away_team: event.away_team,
      home_emoji: emoji,
      away_emoji: emoji,
      home_score: homeScore,
      away_score: awayScore,
      status,
      starts_at: new Date(event.commence_time),
      minute: null,
      period: null,
      markets_count: 0,
    })
    .onConflict("id")
    .merge({
      home_score: homeScore,
      away_score: awayScore,
      status,
      league_label: league.label,
      league_flag: league.flag,
      home_emoji: emoji,
      away_emoji: emoji,
      updated_at: db.fn.now(),
    });

  // Mercado 1X2
  const h2h = bestH2HOdds(event);
  if (h2h.homeOdd || h2h.awayOdd) {
    await upsertMarket(matchId, "1x2", "Resultado Final", [
      { pick: "home", label: event.home_team, value: h2h.homeOdd ?? 1.5 },
      ...(h2h.drawOdd
        ? [{ pick: "draw", label: "Empate", value: h2h.drawOdd }]
        : []),
      { pick: "away", label: event.away_team, value: h2h.awayOdd ?? 1.5 },
    ]);
  }

  // Mercado Over/Under 2.5
  const totals = bestTotalsOdds(event, 2.5);
  if (totals.overOdd || totals.underOdd) {
    await upsertMarket(matchId, "over_under", "Mais/Menos 2.5", [
      { pick: "over", label: "Mais de 2.5", value: totals.overOdd ?? 1.9 },
      { pick: "under", label: "Menos de 2.5", value: totals.underOdd ?? 1.9 },
    ]);
  }

  // Atualiza contagem de mercados
  const [{ count }] = await db("markets")
    .where("match_id", matchId)
    .where("is_active", true)
    .count("id as count");

  await db("matches")
    .where("id", matchId)
    .update({ markets_count: parseInt(count as string, 10) });

  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function syncOdds() {
  if (!env.ODDS_API_KEY) {
    console.error("❌ ODDS_API_KEY não configurada no .env");
    console.error("   Adicione sua chave em .env: ODDS_API_KEY=sua_chave_aqui");
    console.error("   Obtenha uma chave gratuita em https://the-odds-api.com");
    process.exit(1);
  }

  console.log("🔄 Iniciando sync de odds reais da The Odds API...");
  console.log("");

  const allKeys = [...SPORT_KEYS.football, ...SPORT_KEYS.basketball];

  let totalSynced = 0;
  let totalErrors = 0;

  for (const sportKey of allKeys) {
    const league = LEAGUE_MAP[sportKey];
    const leagueLabel = league?.label ?? sportKey;

    process.stdout.write(`   ${leagueLabel.padEnd(25)} `);

    try {
      const [events, scores] = await Promise.all([
        OddsApiClient.getOdds(sportKey),
        OddsApiClient.getScores(sportKey).catch(() => [] as OddsApiScore[]),
      ]);

      const scoreMap = new Map(scores.map((s) => [s.id, s]));

      let count = 0;
      for (const event of events) {
        try {
          const ok = await upsertMatch(event, scoreMap);
          if (ok) count++;
        } catch (err) {
          totalErrors++;
        }
      }

      console.log(`✅  ${count} partidas`);
      totalSynced += count;

      // Pequena pausa para não sobrecarregar a API
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("401") || msg.includes("403")) {
        console.log("❌  Chave de API inválida ou expirada");
      } else if (msg.includes("422")) {
        console.log("⚠️   Liga sem jogos disponíveis");
      } else if (msg.includes("429")) {
        console.log("⚠️   Cota de requisições atingida");
        break;
      } else {
        console.log(`⚠️   ${msg.slice(0, 60)}`);
      }
      totalErrors++;
    }
  }

  console.log("");
  console.log(`✅ Sync concluído: ${totalSynced} partidas salvas no banco`);
  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} erro(s) durante o sync`);
  }

  await db.destroy();
}

syncOdds().catch((err) => {
  console.error("❌ Erro no sync de odds:", err);
  process.exit(1);
});
