/**
 * Migration 006 — Tabela de transações do cassino (PlayFiver)
 *
 * Registra cada callback recebido da PlayFiver (debit/credit/rollback),
 * garantindo idempotência e rastreabilidade completa das rodadas.
 */

import { db } from '../config/database.js';

export async function up() {
  // Verifica se a tabela já existe
  const exists = await db.schema.hasTable('playfiver_transactions');
  if (exists) {
    console.log('⏭  playfiver_transactions já existe, pulando...');
    return;
  }

  await db.schema.createTable('playfiver_transactions', (t) => {
    t.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));

    // Referência ao usuário
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Dados da rodada
    t.string('game_id', 100).notNullable();
    t.string('round_id', 100).notNullable();

    // Ação da PlayFiver
    t.enum('action', ['debit', 'credit', 'rollback']).notNullable();

    // Valores em centavos (integer para evitar floating point)
    t.integer('amount').notNullable();          // valor da transação
    t.integer('balance_before').notNullable();  // saldo antes
    t.integer('balance_after').notNullable();   // saldo depois

    // ID externo da PlayFiver (usado para idempotência)
    t.string('external_transaction_id', 100).notNullable().unique();

    // Status da transação
    t.enum('status', ['completed', 'failed', 'no_op']).notNullable().defaultTo('completed');

    t.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });

  // Índices para performance
  await db.schema.alterTable('playfiver_transactions', (t) => {
    t.index(['user_id'], 'idx_pf_tx_user_id');
    t.index(['game_id', 'round_id'], 'idx_pf_tx_game_round');
    t.index(['created_at'], 'idx_pf_tx_created_at');
  });

  console.log('✅ Tabela playfiver_transactions criada');
}

export async function down() {
  await db.schema.dropTableIfExists('playfiver_transactions');
}

// Execução direta: node --loader ts-node/esm src/database/migrations/006_playfiver.ts
if (process.argv[1]?.includes('006_playfiver')) {
  up()
    .then(() => { console.log('Migration 006 concluída'); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}
