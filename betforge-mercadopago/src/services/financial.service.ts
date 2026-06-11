/**
 * FinancialService — integrado com Mercado Pago
 *
 * Fluxo de depósito:
 *  1. Valida limites e dados do usuário
 *  2. Cria a transação local com status 'pending'
 *  3. Cria o payment no Mercado Pago; armazena external_id (payment_id)
 *  4. Retorna os dados de pagamento ao frontend
 *  5. Webhook do MP confirma → status vira 'completed' + balance atualizado
 *
 * Fluxo de saque:
 *  1. Valida saldo, KYC e limites
 *  2. Debita o saldo imediatamente (reserva)
 *  3. Cria transação 'pending'
 *  4. Dispara payout PIX no Mercado Pago
 *  5. Webhook confirma / falha → atualiza status
 */

import { db } from '../config/database.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import {
  NotFoundError,
  AppError,
  InsufficientBalanceError,
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { PaymentMethod, PaginationParams } from '../types/index.js';
import * as MercadoPago from './mercadopago.service.js';

export interface DepositDTO {
  userId: string;
  amount: number;
  method: PaymentMethod;
  cardToken?: string;
  cardId?: string;
  installments?: number;
  issuerId?: string;
  metadata?: Record<string, unknown>;
}

export interface WithdrawDTO {
  userId: string;
  amount: number;
  method: PaymentMethod;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random_key';
  bankData?: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
  };
}

const DEPOSIT_LIMITS: Record<PaymentMethod, { min: number; max: number }> = {
  pix:         { min: 10,  max: 50000  },
  credit_card: { min: 20,  max: 10000  },
  boleto:      { min: 30,  max: 5000   },
  crypto:      { min: 50,  max: 100000 },
  ted:         { min: 50,  max: 100000 },
};

const WITHDRAW_LIMITS: Record<PaymentMethod, { min: number; max: number }> = {
  pix:         { min: 20,  max: 50000  },
  ted:         { min: 50,  max: 20000  },
  crypto:      { min: 100, max: 100000 },
  credit_card: { min: 0,   max: 0      },
  boleto:      { min: 0,   max: 0      },
};

// Mercado Pago trabalha com valores em Reais (float), não centavos
function toReais(reais: number): number {
  return Math.round(reais * 100) / 100;
}

async function resolvePayerInfo(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) throw new NotFoundError('Usuário não encontrado');

  const nameParts = user.name.trim().split(' ');
  return {
    user,
    payerEmail: user.email,
    payerCpf: user.cpf,
    payerFirstName: nameParts[0],
    payerLastName: nameParts.slice(1).join(' ') || nameParts[0],
  };
}

export const FinancialService = {

  async deposit(dto: DepositDTO) {
    const { userId, amount, method, cardToken, installments, issuerId, metadata } = dto;

    const { user, payerEmail, payerCpf, payerFirstName, payerLastName } = await resolvePayerInfo(userId);

    if (user.status === 'suspended') {
      throw new AppError('Conta suspensa. Contate o suporte.', 403);
    }

    const limits = DEPOSIT_LIMITS[method];
    if (!limits) throw new AppError('Método de pagamento inválido');

    if (amount < limits.min) throw new AppError(`Valor mínimo para ${method} é R$ ${limits.min.toFixed(2)}`);
    if (amount > limits.max) throw new AppError(`Valor máximo para ${method} é R$ ${limits.max.toFixed(2)}`);

    const transaction = await TransactionRepository.create({
      user_id: userId,
      type: 'deposit',
      status: 'pending',
      amount,
      method,
      metadata: { ...metadata },
    });

    let paymentData: Record<string, unknown> = {};

    try {
      const amountReais = toReais(amount);
      const description = `BetForge Deposito #${transaction.id.slice(0, 8)}`;

      if (method === 'pix') {
        const payment = await MercadoPago.createPixPayment({
          amountReais,
          description,
          orderId: transaction.id,
          payerEmail,
          payerCpf,
          payerFirstName,
          payerLastName,
          expiresInMinutes: 60,
        });
        await TransactionRepository.updateExternalId(transaction.id, String(payment.id));
        paymentData = {
          paymentId: payment.id,
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
          ticketUrl: payment.point_of_interaction.transaction_data.ticket_url,
          expiresAt: payment.date_of_expiration,
        };

      } else if (method === 'boleto') {
        const payment = await MercadoPago.createBoletoPayment({
          amountReais,
          description,
          orderId: transaction.id,
          payerEmail,
          payerCpf,
          payerFirstName,
          payerLastName,
          dueDays: 3,
        });
        await TransactionRepository.updateExternalId(transaction.id, String(payment.id));
        paymentData = {
          paymentId: payment.id,
          boletoLine: payment.barcode.content,
          boletoPdf: payment.transaction_details.external_resource_url,
          dueAt: payment.date_of_expiration,
        };

      } else if (method === 'credit_card') {
        if (!cardToken) {
          throw new AppError('Token do cartão obrigatório para pagamento com cartão', 400);
        }
        const payment = await MercadoPago.createCreditCardPayment({
          amountReais,
          description,
          orderId: transaction.id,
          payerEmail,
          payerCpf,
          payerFirstName,
          payerLastName,
          cardToken,
          installments: installments ?? 1,
          issuerId,
        });
        await TransactionRepository.updateExternalId(transaction.id, String(payment.id));

        const approved = payment.status === 'approved';
        if (approved) {
          await db.transaction(async (trx) => {
            await TransactionRepository.updateStatus(transaction.id, 'completed', new Date(), trx);
            await UserRepository.updateBalance(userId, amount, trx);
          });
        }
        paymentData = {
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          paymentMethodId: payment.payment_method_id,
          lastFour: payment.card?.last_four_digits,
          installments: payment.installments,
          approved,
        };

      } else {
        paymentData = { info: 'Instrucoes de pagamento enviadas por e-mail.' };
      }

    } catch (err) {
      await TransactionRepository.updateStatus(transaction.id, 'failed');
      logger.error('Erro ao criar payment Mercado Pago', { err, transactionId: transaction.id });
      throw err;
    }

    return {
      transaction: { id: transaction.id, method, amount, status: transaction.status },
      paymentData,
      message: method === 'pix'
        ? 'QR Code PIX gerado. Pague em ate 1 hora.'
        : method === 'boleto'
        ? 'Boleto gerado. Prazo de pagamento: 3 dias uteis.'
        : method === 'credit_card' && (paymentData.approved as boolean)
        ? 'Deposito aprovado!'
        : 'Aguardando confirmacao do pagamento.',
    };
  },

  async withdraw(dto: WithdrawDTO) {
    const { userId, amount, method, pixKey, pixKeyType, bankData } = dto;

    const { user } = await resolvePayerInfo(userId);

    const limits = WITHDRAW_LIMITS[method];
    if (!limits || limits.max === 0) throw new AppError(`Método ${method} não disponível para saques`);

    if (amount < limits.min) throw new AppError(`Valor mínimo para saque via ${method} é R$ ${limits.min.toFixed(2)}`);
    if (amount > limits.max) throw new AppError(`Valor máximo para saque via ${method} é R$ ${limits.max.toFixed(2)}`);

    if (user.balance < amount) {
      throw new InsufficientBalanceError(`Saldo insuficiente. Disponível: R$ ${user.balance.toFixed(2)}`);
    }

    if (user.kyc_status !== 'verified') {
      throw new AppError('Verificação de identidade necessária para realizar saques', 403, 'KYC_REQUIRED');
    }

    if (method === 'pix' && !pixKey) {
      throw new AppError('Chave PIX obrigatória para saque via PIX', 400);
    }

    const transaction = await db.transaction(async (trx) => {
      await UserRepository.updateBalance(userId, -amount, trx);
      return TransactionRepository.create(
        { user_id: userId, type: 'withdraw', status: 'pending', amount, method, metadata: { pixKey, pixKeyType, bankData } },
        trx,
      );
    });

    if (method === 'pix') {
      try {
        const payout = await MercadoPago.createPixPayout({
          amountReais: toReais(amount),
          pixKey: pixKey!,
          pixKeyType: pixKeyType ?? 'cpf',
          holderName: user.name,
          holderDocument: user.cpf,
          orderId: transaction.id,
        });
        await TransactionRepository.updateExternalId(transaction.id, payout.id);
        if (payout.status === 'processed') {
          await TransactionRepository.updateStatus(transaction.id, 'completed', new Date());
        }
      } catch (err) {
        logger.error('Erro na transferência PIX Mercado Pago', { err, transactionId: transaction.id });
        await db.transaction(async (trx) => {
          await UserRepository.updateBalance(userId, amount, trx);
          await TransactionRepository.updateStatus(transaction.id, 'failed', undefined, trx);
        });
        throw new AppError('Não foi possível processar o saque. Tente novamente.', 502, 'WITHDRAW_FAILED');
      }
    }

    return {
      transaction: { id: transaction.id, method, amount, status: 'pending' },
      message: method === 'pix'
        ? 'Saque processado! Você receberá o PIX em instantes.'
        : 'Saque solicitado com sucesso! Será processado em até 24h.',
      newBalance: user.balance - amount,
    };
  },

  async getTransactions(userId: string, params: PaginationParams & { type?: string }) {
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

  async cancelDeposit(transactionId: string, userId: string) {
    const tx = await TransactionRepository.findById(transactionId);
    if (!tx) throw new NotFoundError('Transação não encontrada');
    if (tx.user_id !== userId) throw new AppError('Acesso negado', 403);
    if (tx.status !== 'pending') throw new AppError('Apenas transações pendentes podem ser canceladas');

    if (tx.external_id) {
      await MercadoPago.cancelPayment(tx.external_id);
    }
    await TransactionRepository.updateStatus(transactionId, 'cancelled');
    return { message: 'Cobrança cancelada com sucesso.' };
  },
};
