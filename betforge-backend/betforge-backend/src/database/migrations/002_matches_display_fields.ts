import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('matches', (t) => {
    t.string('league_label', 100);   // "Brasileirão A"
    t.string('league_flag', 10);     // "🇧🇷"
    t.string('round', 80);           // "Rod. 12"
    t.string('home_emoji', 20);      // "🔴"
    t.string('away_emoji', 20);      // "⚫"
    t.integer('markets_count').defaultTo(0);
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
