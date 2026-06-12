import type { Knex } from 'knex';

/**
 * Migration 004 — Integração Mercado Pago
 *
 * Alterações:
 *  - users: adiciona `mp_customer_id` (identificador do pagador no MP)
 *  - transactions: garante índice em `external_id` para lookup rápido nos webhooks
 */
export async function up(knex: Knex): Promise<void> {
  // Adiciona mp_customer_id em users (nullable: referência ao e-mail/CPF usado nos payments)
  await knex.schema.alterTable('users', (t) => {
    t.string('mp_customer_id', 100).nullable().after('kyc_status');
    t.index('mp_customer_id', 'idx_users_mp_customer_id');
  });

  // Garante índice em external_id das transactions (webhooks fazem lookup por este campo)
  const hasTable = await knex.schema.hasTable('transactions');
  if (hasTable) {
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_transactions_external_id
      ON transactions (external_id)
      WHERE external_id IS NOT NULL
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_external_id');

  await knex.schema.alterTable('users', (t) => {
    t.dropIndex('mp_customer_id', 'idx_users_mp_customer_id');
    t.dropColumn('mp_customer_id');
  });
}
