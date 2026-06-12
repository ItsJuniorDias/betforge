import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Erro operacional esperado
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError) {
      body.errors = err.errors;
    }

    logger.warn('Operational error', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json(body);
  }

  // Erro inesperado - logar com stack trace
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
