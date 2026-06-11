import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  API_VERSION: z.string().default('v1'),

  // Database — defaults para dev com docker-compose
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('betforge'),
  DB_PASS: z.string().default('betforge_secret'),
  DB_NAME: z.string().default('betforge_db'),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT — defaults apenas para dev (em produção OBRIGATÓRIO trocar)
  JWT_SECRET: z
    .string()
    .default('betforge_dev_secret_32chars_minimum_ok!')
    .refine(
      (v) => process.env.NODE_ENV !== 'production' || v.length >= 32,
      'JWT_SECRET deve ter no mínimo 32 caracteres em produção'
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('betforge_dev_refresh_secret_32chars!')
    .refine(
      (v) => process.env.NODE_ENV !== 'production' || v.length >= 32,
      'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres em produção'
    ),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  LOG_DIR: z.string().default('./logs'),

  // The Odds API (https://the-odds-api.com)
  ODDS_API_KEY: z.string().default(''),
  // Intervalo mínimo entre chamadas à API (segundos). Default: 60s
  ODDS_CACHE_TTL_SECONDS: z.coerce.number().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

// Aviso em produção sem secrets configurados
if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.JWT_SECRET.startsWith('betforge_dev_')
) {
  console.error('🚨 ATENÇÃO: Usando JWT_SECRET padrão em produção! Defina no .env');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
