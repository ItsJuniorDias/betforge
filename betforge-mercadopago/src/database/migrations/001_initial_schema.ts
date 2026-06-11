import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ─── UUID extension ───────────────────────────────────────────────────────────
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // ─── Users ────────────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('cpf', 14).notNullable().unique();
    t.string('phone', 20).notNullable();
    t.date('birthdate').notNullable();
    t.text('password_hash').notNullable();
    t.enum('role', ['user', 'admin', 'affiliate']).defaultTo('user');
    t.enum('status', ['active', 'suspended', 'pending_verification']).defaultTo('active');
    t.enum('kyc_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
    t.enum('level', ['bronze', 'silver', 'gold', 'platinum', 'diamond']).defaultTo('bronze');
    t.decimal('balance', 15, 2).defaultTo(0);
    t.decimal('bonus_balance', 15, 2).defaultTo(0);
    t.string('avatar_url', 500);
    t.timestamp('email_verified_at');
    t.timestamp('phone_verified_at');
    t.timestamp('last_login_at');
    t.timestamps(true, true);

    t.index('email');
    t.index('cpf');
    t.index('status');
  });

  // ─── Matches ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('matches', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.enum('sport', ['football', 'basketball', 'tennis', 'mma', 'esports', 'baseball', 'hockey', 'americanfootball']).notNullable();
    t.string('league_id', 100).notNullable();
    t.string('home_team', 100).notNullable();
    t.string('away_team', 100).notNullable();
    t.integer('home_score').defaultTo(0);
    t.integer('away_score').defaultTo(0);
    t.enum('status', ['scheduled', 'live', 'finished', 'cancelled', 'postponed']).defaultTo('scheduled');
    t.timestamp('starts_at').notNullable();
    t.integer('minute');
    t.string('period', 50);
    t.timestamps(true, true);

    t.index('sport');
    t.index('status');
    t.index('starts_at');
  });

  // ─── Markets ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('markets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
    t.string('label', 200).notNullable();
    t.string('type', 100).notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);

    t.index('match_id');
  });

  // ─── Odds ─────────────────────────────────────────────────────────────────────
  await knex.schema.createTable('odds', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('market_id').notNullable().references('id').inTable('markets').onDelete('CASCADE');
    t.string('pick', 100).notNullable();
    t.string('label', 200).notNullable();
    t.decimal('value', 8, 4).notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('updated_at').defaultTo(knex.fn.now());

    t.index('market_id');
  });

  // ─── Bets ─────────────────────────────────────────────────────────────────────
  await knex.schema.createTable('bets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.enum('type', ['single', 'multiple', 'system']).notNullable();
    t.enum('status', ['pending', 'won', 'lost', 'cancelled', 'cashed_out']).defaultTo('pending');
    t.decimal('stake', 12, 2).notNullable();
    t.decimal('potential_payout', 15, 2).notNullable();
    t.decimal('actual_payout', 15, 2);
    t.decimal('total_odd', 12, 4).notNullable();
    t.timestamp('settled_at');
    t.timestamps(true, true);

    t.index('user_id');
    t.index('status');
    t.index('created_at');
  });

  // ─── Bet Selections ───────────────────────────────────────────────────────────
  await knex.schema.createTable('bet_selections', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('bet_id').notNullable().references('id').inTable('bets').onDelete('CASCADE');
    // match_id é string livre (pode ser UUID ou ID externo como "live-1", "up-2")
    t.string('match_id', 150).notNullable();
    t.string('market_id', 100).notNullable();
    t.string('pick', 100).notNullable();
    t.string('label', 200).notNullable();
    t.decimal('odd', 8, 4).notNullable();
    t.enum('status', ['pending', 'won', 'lost', 'cancelled', 'void']).defaultTo('pending');
    t.string('match_label', 200).notNullable();
    t.string('market_label', 200).notNullable();
    t.timestamps(true, true);

    t.index('bet_id');
  });

  // ─── Transactions ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.enum('type', ['deposit', 'withdraw', 'bet_stake', 'bet_win', 'bet_refund', 'bonus']).notNullable();
    t.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    t.decimal('amount', 15, 2).notNullable();
    t.enum('method', ['pix', 'credit_card', 'boleto', 'crypto', 'ted']);
    t.string('external_id', 255);
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('processed_at');
    t.timestamps(true, true);

    t.index('user_id');
    t.index('type');
    t.index('status');
    t.index('created_at');
  });

  // ─── Notifications ────────────────────────────────────────────────────────────
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enum('type', ['bet_settled', 'deposit_confirmed', 'withdraw_processed', 'promotion', 'system']).notNullable();
    t.string('title', 200).notNullable();
    t.text('message').notNullable();
    t.boolean('is_read').defaultTo(false);
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);

    t.index('user_id');
    t.index('is_read');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('bet_selections');
  await knex.schema.dropTableIfExists('bets');
  await knex.schema.dropTableIfExists('odds');
  await knex.schema.dropTableIfExists('markets');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('users');
}
