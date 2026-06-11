import { db } from '../config/database.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import {
  NotFoundError,
  AppError,
  InsufficientBalanceError,
} from '../utils/errors.js';
import type { PaymentMethod, PaginationParams } from '../types/index.js';

interface DepositDTO {
  userId: string;
  amount: number;
  method: PaymentMethod;
  metadata?: Record<string, unknown>;
}

interface WithdrawDTO {
  userId: string;
  amount: number;
  method: PaymentMethod;
  pixKey?: string;
  bankData?: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
  };
}

const DEPOSIT_LIMITS: Record<PaymentMethod, { min: number; max: number }> = {
  pix: { min: 10, max: 50000 },
  credit_card: { min: 20, max: 10000 },
  boleto: { min: 30, max: 5000 },
  crypto: { min: 50, max: 100000 },
  ted: { min: 50, max: 100000 },
};

const WITHDRAW_LIMITS: Record<PaymentMethod, { min: number; max: number }> = {
  pix: { min: 20, max: 50000 },
  ted: { min: 50, max: 20000 },
  crypto: { min: 100, max: 100000 },
  credit_card: { min: 0, max: 0 }, // Não disponível para saque
  boleto: { min: 0, max: 0 },
};

export const FinancialService = {
  async deposit(dto: DepositDTO) {
    const { userId, amount, method, metadata } = dto;

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const limits = DEPOSIT_LIMITS[method];
    if (!limits) throw new AppError('Método de pagamento inválido');

    if (amount < limits.min) {
      throw new AppError(`Valor mínimo para ${method} é R$ ${limits.min.toFixed(2)}`);
    }

    if (amount > limits.max) {
      throw new AppError(`Valor máximo para ${method} é R$ ${limits.max.toFixed(2)}`);
    }

    return db.transaction(async (trx) => {
      // Para PIX: processa imediatamente (em produção aguardaria webhook)
      const isInstant = method === 'pix';
      const status = isInstant ? 'completed' : 'pending';

      const transaction = await TransactionRepository.create(
        {
          user_id: userId,
          type: 'deposit',
          status,
          amount,
          method,
          metadata: metadata || {},
          processed_at: isInstant ? new Date() : undefined,
        },
        trx
      );

      if (isInstant) {
        await UserRepository.updateBalance(userId, amount, trx);
      }

      return {
        transaction,
        message: isInstant
          ? 'Depósito realizado com sucesso!'
          : 'Depósito registrado. Aguardando confirmação.',
        newBalance: isInstant ? user.balance + amount : user.balance,
      };
    });
  },

  async withdraw(dto: WithdrawDTO) {
    const { userId, amount, method, pixKey, bankData } = dto;

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const limits = WITHDRAW_LIMITS[method];
    if (!limits || limits.max === 0) {
      throw new AppError(`Método ${method} não disponível para saques`);
    }

    if (amount < limits.min) {
      throw new AppError(`Valor mínimo para saque via ${method} é R$ ${limits.min.toFixed(2)}`);
    }

    if (amount > limits.max) {
      throw new AppError(`Valor máximo para saque via ${method} é R$ ${limits.max.toFixed(2)}`);
    }

    if (user.balance < amount) {
      throw new InsufficientBalanceError(
        `Saldo insuficiente. Disponível: R$ ${user.balance.toFixed(2)}`
      );
    }

    if (user.kyc_status !== 'verified') {
      throw new AppError(
        'Verificação de identidade necessária para realizar saques',
        403,
        'KYC_REQUIRED'
      );
    }

    return db.transaction(async (trx) => {
      await UserRepository.updateBalance(userId, -amount, trx);

      const transaction = await TransactionRepository.create(
        {
          user_id: userId,
          type: 'withdraw',
          status: 'pending',
          amount,
          method,
          metadata: {
            pixKey,
            bankData,
          },
        },
        trx
      );

      return {
        transaction,
        message: 'Saque solicitado com sucesso! Será processado em até 24h.',
        newBalance: user.balance - amount,
      };
    });
  },

  async getTransactions(
    userId: string,
    params: PaginationParams & { type?: string }
  ) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    return TransactionRepository.findByUserId(userId, params);
  },

  async getBalance(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    return {
      balance: user.balance,
      bonusBalance: user.bonus_balance,
      total: user.balance + user.bonus_balance,
    };
  },
};
