import type { Knex } from 'knex';

/**
 * Migration 003 — garante que todas as colunas de display existam na tabela matches.
 * A migration 002 pode não ter sido aplicada em algumas instâncias.
 * Usa "addColumnIfNotExists" via raw para ser idempotente.
 */
export async function up(knex: Knex): Promise<void> {
  const hasLeagueLabel  = await knex.schema.hasColumn('matches', 'league_label');
  const hasLeagueFlag   = await knex.schema.hasColumn('matches', 'league_flag');
  const hasRound        = await knex.schema.hasColumn('matches', 'round');
  const hasHomeEmoji    = await knex.schema.hasColumn('matches', 'home_emoji');
  const hasAwayEmoji    = await knex.schema.hasColumn('matches', 'away_emoji');
  const hasMarketsCount = await knex.schema.hasColumn('matches', 'markets_count');

  await knex.schema.alterTable('matches', (t) => {
    if (!hasLeagueLabel)  t.string('league_label', 100);
    if (!hasLeagueFlag)   t.string('league_flag', 10);
    if (!hasRound)        t.string('round', 80);
    if (!hasHomeEmoji)    t.string('home_emoji', 20);
    if (!hasAwayEmoji)    t.string('away_emoji', 20);
    if (!hasMarketsCount) t.integer('markets_count').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('matches', (t) => {
    t.dropColumn('league_label');
    t.dropColumn('league_flag');
    t.dropColumn('round');
    t.dropColumn('home_emoji');
    t.dropColumn('away_emoji');
    t.dropColumn('markets_count');
  });
}
