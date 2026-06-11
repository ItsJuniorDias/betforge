import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD || undefined,
});

redis.on('error', (err) => logger.error('Redis Client Error', { err }));
redis.on('connect', () => logger.info('✅ Redis conectado com sucesso'));
redis.on('reconnecting', () => logger.warn('Redis reconectando...'));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}
