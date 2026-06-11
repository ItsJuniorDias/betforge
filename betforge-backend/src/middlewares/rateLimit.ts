import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

export const betRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas apostas por minuto. Aguarde antes de continuar.',
    code: 'BET_RATE_LIMIT_EXCEEDED',
  },
});
