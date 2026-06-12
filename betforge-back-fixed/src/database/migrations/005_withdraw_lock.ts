/**
 * Migration 005 — Withdraw lock (carência de 3 dias)
 *
 * Adiciona:
 *  - transactions.withdraw_available_at : quando o saldo de um depósito pode
 *    ser sacado (created_at do depósito + 3 dias). Preenchido no webhook de
 *    confirmação de depósito.
 *  - users.withdrawable_balance         : saldo efetivamente disponível para
 *    saque (descontando depósitos ainda em carência).
 *
 * Estratégia:
 *  Em vez de manter uma coluna derivada na tabela users (que precisaria de
 *  atualização a cada depósito), calculamos withdrawable_balance em tempo
 *  real somando apenas as transações de depósito cujo withdraw_available_at
 *  já passou. Isso mantém o banco simples e evita race conditions.
 *
 *  A coluna withdraw_available_at nas transações de saque fica NULL — ela só
 *  é relevante para depósitos.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (t) => {
    // Data a partir da qual o valor deste depósito pode ser sacado
    t.timestamp('withdraw_available_at').nullable().defaultTo(null);
  });

  // Índice para acelerar a query de saldo disponível para saque
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_transactions_withdraw_available
      ON transactions (user_id, type, status, withdraw_available_at)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_withdraw_available');
  await knex.schema.alterTable('transactions', (t) => {
    t.dropColumn('withdraw_available_at');
  });
}
