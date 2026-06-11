import knex from 'knex';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const db = knex({
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    afterCreate: (conn: any, done: any) => {
      conn.query('SET timezone="America/Sao_Paulo"', (err: Error) => {
        done(err, conn);
      });
    },
  },
  acquireConnectionTimeout: 10000,
});

export async function testConnection(): Promise<void> {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Banco de dados conectado com sucesso');
  } catch (error) {
    logger.error('❌ Falha ao conectar no banco de dados', { error });
    throw error;
  }
}
