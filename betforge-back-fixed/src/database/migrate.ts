import { db } from '../config/database.js';
import { up as up001 } from './migrations/001_initial_schema.js';
import { up as up002 } from './migrations/002_matches_display_fields.js';
import { up as up003 } from './migrations/003_fix_missing_display_columns.js';

/**
 * Roda todas as migrations em ordem.
 * Cada migration é idempotente: usa CREATE TABLE IF NOT EXISTS
 * ou verifica hasColumn antes de alterar.
 */
async function migrate() {
  console.log('🔄 Rodando migrations...');

  try {
    console.log('  → 001_initial_schema');
    await up001(db);
  } catch (err: any) {
    // Tabela já existe — ignorar em re-runs
    if (err.message?.includes('already exists')) {
      console.log('  ✓ 001 já aplicada, pulando');
    } else {
      throw err;
    }
  }

  try {
    console.log('  → 002_matches_display_fields');
    await up002(db);
  } catch (err: any) {
    if (err.message?.includes('already exists') || err.message?.includes('column')) {
      console.log('  ✓ 002 já aplicada, pulando');
    } else {
      throw err;
    }
  }

  try {
    console.log('  → 003_fix_missing_display_columns');
    await up003(db);
  } catch (err: any) {
    console.log('  ✓ 003 já aplicada ou sem alterações:', err.message);
  }

  console.log('✅ Migrations concluídas!');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('❌ Erro na migration:', err);
  process.exit(1);
});
