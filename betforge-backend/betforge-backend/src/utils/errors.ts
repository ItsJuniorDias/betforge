export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Dados inválidos') {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message = 'Saldo insuficiente') {
    super(message, 422, 'INSUFFICIENT_BALANCE');
  }
}

export class BetAlreadySettledError extends AppError {
  constructor(message = 'Aposta já foi liquidada') {
    super(message, 422, 'BET_ALREADY_SETTLED');
  }
}
