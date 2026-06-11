import { db } from '../config/database.js';
import { up } from './migrations/001_initial_schema.js';

async function migrate() {
  console.log('🔄 Rodando migrations...');
  await up(db);
  console.log('✅ Migrations concluídas!');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('❌ Erro na migration:', err);
  process.exit(1);
});
