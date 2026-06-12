/**
 * FinancialService — integrado com Mercado Pago
 *
 * ──────────────────────────────────────────────────────────────
 * MUDANÇAS NESTA VERSÃO
 * ──────────────────────────────────────────────────────────────
 *
 * 1. CARÊNCIA DE 3 DIAS NO SAQUE
 *    - Ao confirmar um depósito (webhook ou cartão), setamos
 *      withdraw_available_at = now + 3 dias na transação.
 *    - Na hora do saque, calculamos o saldo "desbloqueado":
 *      só depósitos com withdraw_available_at <= now entram
 *      no cálculo. Isso impede que o usuário saque antes de
 *      o depósito ter maturado.
 *    - Ganhos de apostas (bet_win) e bônus não têm carência.
 *
 * 2. SAQUE AUTOMÁTICO VIA MERCADO PAGO PAYOUTS
 *    - A função `createPixPayout` do mercadopago.service.ts
 *      (endpoint /v1/settlements) já estava implementada mas
 *      não era chamada.
 *    - Agora é chamada imediatamente após debitar o saldo.
 *    - O external_id do disbursement é salvo na transação.
 *    - Webhooks disbursement.failed / disbursement.completed
 *      já existem no webhook.controller.ts e fazem o tratamento
 *      correto (estorno no caso de falha).
 *    - Caso o payout falhe (rede, saldo insuficiente na conta
 *      MP, etc.), o saldo é devolvido automaticamente e a
 *      transação vai para 'failed'.
 *
 * ──────────────────────────────────────────────────────────────
 * REQUISITO DE CONFIGURAÇÃO
 * ──────────────────────────────────────────────────────────────
 *  - A conta do Mercado Pago precisa ter o produto "Money Out"
 *    (Disbursements) habilitado. Solicite em:
 *    https://www.mercadopago.com.br/developers/pt/docs/money-out/landing
 *  - Execute a migration 005_withdraw_lock antes de subir esta versão.
 */

import { db } from '../config/database.js';
import {
  TransactionRepository,
  WITHDRAW_LOCK_DAYS,
} from '../repositories/transaction.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import {
  NotFoundError,
  AppError,
  InsufficientBalanceError,
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { PaymentMethod, PaginationParams } from '../types/index.js';
import * as MercadoPago from './mercadopago.service.js';
import { NotificationService } from './notification.service.js';

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
  credit_card: { min: 0, max: 0 },
  boleto: { min: 0, max: 0 },
};

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

/** Data em que o saldo de um depósito poderá ser sacado */
function calcWithdrawAvailableAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + WITHDRAW_LOCK_DAYS);
  return d;
}

export const FinancialService = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DEPÓSITO
  // ─────────────────────────────────────────────────────────────────────────────

  async deposit(dto: DepositDTO) {
    const {
      userId,
      amount,
      method,
      cardToken,
      installments,
      issuerId,
      metadata,
    } = dto;

    const { user, payerEmail, payerCpf, payerFirstName, payerLastName } =
      await resolvePayerInfo(userId);

    if (user.status === 'suspended') {
      throw new AppError('Conta suspensa. Contate o suporte.', 403);
    }

    const limits = DEPOSIT_LIMITS[method];
    if (!limits) throw new AppError('Método de pagamento inválido');

    if (amount < limits.min)
      throw new AppError(`Valor mínimo para ${method} é R$ ${limits.min.toFixed(2)}`);
    if (amount > limits.max)
      throw new AppError(`Valor máximo para ${method} é R$ ${limits.max.toFixed(2)}`);

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
        await NotificationService.notifyDepositPending(userId, amount, method).catch(() => null);
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
          const withdrawAvailableAt = calcWithdrawAvailableAt();
          await db.transaction(async (trx) => {
            await TransactionRepository.updateStatus(transaction.id, 'completed', new Date(), trx);
            await TransactionRepository.setWithdrawAvailableAt(
              transaction.id,
              withdrawAvailableAt,
              trx,
            );
            await UserRepository.updateBalance(userId, amount, trx);
          });
        }
        if (approved) {
          await NotificationService.notifyDepositConfirmed(userId, amount, method).catch(() => null);
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
        paymentData = { info: 'Instruções de pagamento enviadas por e-mail.' };
      }
    } catch (err) {
      await TransactionRepository.updateStatus(transaction.id, 'failed');
      logger.error('Erro ao criar payment Mercado Pago', {
        err,
        transactionId: transaction.id,
      });
      throw err;
    }

    return {
      transaction: {
        id: transaction.id,
        method,
        amount,
        status: transaction.status,
      },
      paymentData,
      message:
        method === 'pix'
          ? 'QR Code PIX gerado. Pague em até 1 hora.'
          : method === 'boleto'
            ? 'Boleto gerado. Prazo de pagamento: 3 dias úteis.'
            : method === 'credit_card' && (paymentData.approved as boolean)
              ? `Depósito aprovado! Saque disponível em ${WITHDRAW_LOCK_DAYS} dias.`
              : 'Aguardando confirmação do pagamento.',
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SAQUE AUTOMÁTICO
  // ─────────────────────────────────────────────────────────────────────────────

  async withdraw(dto: WithdrawDTO) {
    const { userId, amount, method, pixKey, pixKeyType, bankData } = dto;

    const { user } = await resolvePayerInfo(userId);

    const limits = WITHDRAW_LIMITS[method];
    if (!limits || limits.max === 0)
      throw new AppError(`Método ${method} não disponível para saques`);

    if (amount < limits.min)
      throw new AppError(
        `Valor mínimo para saque via ${method} é R$ ${limits.min.toFixed(2)}`,
      );
    if (amount > limits.max)
      throw new AppError(
        `Valor máximo para saque via ${method} é R$ ${limits.max.toFixed(2)}`,
      );

    // ── Verifica saldo real ───────────────────────────────────────────────────
    if (user.balance < amount) {
      throw new InsufficientBalanceError(
        `Saldo insuficiente. Disponível: R$ ${user.balance.toFixed(2)}`,
      );
    }

    // ── Verifica saldo liberado (carência de 3 dias) ──────────────────────────
    const withdrawableBalance =
      await TransactionRepository.getWithdrawableBalance(userId);

    if (amount > withdrawableBalance) {
      const lockedDeposits = await TransactionRepository.getLockedDeposits(userId);
      const nextUnlock =
        lockedDeposits.length > 0
          ? new Date(lockedDeposits[0].withdraw_available_at!).toLocaleDateString('pt-BR')
          : 'em breve';

      throw new AppError(
        `Saldo ainda em carência. Disponível para saque: R$ ${withdrawableBalance.toFixed(2)}. ` +
          `Próxima liberação: ${nextUnlock}.`,
        403,
        'WITHDRAW_LOCKED',
      );
    }

    // ── KYC ──────────────────────────────────────────────────────────────────
    if (user.kyc_status !== 'verified') {
      throw new AppError(
        'Verificação de identidade necessária para realizar saques',
        403,
        'KYC_REQUIRED',
      );
    }

    if (method === 'pix' && !pixKey) {
      throw new AppError('Chave PIX obrigatória para saque via PIX', 400);
    }

    // ── Debita saldo e cria transação (dentro de db.transaction) ─────────────
    const transaction = await db.transaction(async (trx) => {
      await UserRepository.updateBalance(userId, -amount, trx);
      return TransactionRepository.create(
        {
          user_id: userId,
          type: 'withdraw',
          status: 'pending',
          amount,
          method,
          metadata: { pixKey, pixKeyType, bankData },
        },
        trx,
      );
    });

    // ── Dispara o Payout automático via Mercado Pago ──────────────────────────
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

        // Salva o ID do disbursement para rastrear via webhook
        await TransactionRepository.updateExternalId(transaction.id, String(payout.id));

        logger.info('Payout PIX criado com sucesso', {
          transactionId: transaction.id,
          payoutId: payout.id,
          userId,
          amount,
        });

        await NotificationService.notifyWithdrawRequested(userId, amount, method).catch(() => null);

        return {
          transaction: { id: transaction.id, method, amount, status: 'pending' },
          message:
            'Saque solicitado! O PIX será processado pelo Mercado Pago em instantes.',
          newBalance: user.balance - amount,
          payoutId: payout.id,
        };
      } catch (payoutErr) {
        // ── Falha no payout: estorna o saldo imediatamente ────────────────────
        logger.error('Falha ao criar payout PIX — estornando saldo', {
          err: payoutErr,
          transactionId: transaction.id,
          userId,
          amount,
        });

        await db.transaction(async (trx) => {
          await UserRepository.updateBalance(userId, amount, trx); // devolve
          await TransactionRepository.updateStatus(transaction.id, 'failed', new Date(), trx);
        });

        throw new AppError(
          'Não foi possível processar o saque no momento. Seu saldo foi estornado. Tente novamente.',
          502,
          'PAYOUT_FAILED',
        );
      }
    }

    // ── Outros métodos (TED, crypto) — mantém fluxo semi-manual ──────────────
    logger.info('Saque solicitado — método não-PIX, processamento manual', {
      transactionId: transaction.id,
      userId,
      amount,
      method,
    });

    await NotificationService.notifyWithdrawRequested(userId, amount, method).catch(() => null);

    return {
      transaction: { id: transaction.id, method, amount, status: 'pending' },
      message: 'Saque solicitado com sucesso! Será processado em até 24h.',
      newBalance: user.balance - amount,
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SALDO
  // ─────────────────────────────────────────────────────────────────────────────

  async getBalance(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const withdrawableBalance =
      await TransactionRepository.getWithdrawableBalance(userId);
    const lockedDeposits = await TransactionRepository.getLockedDeposits(userId);

    return {
      balance: user.balance,
      bonusBalance: user.bonus_balance,
      total: user.balance + user.bonus_balance,
      // Saldo efetivamente disponível para saque
      withdrawableBalance,
      // Depósitos ainda em carência para o frontend exibir aviso
      lockedDeposits: lockedDeposits.map((d) => ({
        amount: d.amount,
        availableAt: d.withdraw_available_at,
      })),
    };
  },

  async getTransactions(
    userId: string,
    params: PaginationParams & { type?: string },
  ) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return TransactionRepository.findByUserId(userId, params);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIRMAÇÃO MANUAL (admin — para métodos não-PIX pendentes)
  // ─────────────────────────────────────────────────────────────────────────────

  async confirmWithdraw(transactionId: string) {
    const tx = await TransactionRepository.findById(transactionId);
    if (!tx) throw new NotFoundError('Transação não encontrada');
    if (tx.type !== 'withdraw') throw new AppError('Transação não é um saque', 400);
    if (tx.status !== 'pending')
      throw new AppError(`Saque já está com status '${tx.status}'`, 400);

    await TransactionRepository.updateStatus(transactionId, 'completed', new Date());

    logger.info('Saque confirmado manualmente', {
      transactionId,
      amount: tx.amount,
    });
    return { message: 'Saque confirmado com sucesso.', transactionId };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CANCELAMENTOS
  // ─────────────────────────────────────────────────────────────────────────────

  async cancelWithdraw(transactionId: string, userId: string) {
    const tx = await TransactionRepository.findById(transactionId);
    if (!tx) throw new NotFoundError('Transação não encontrada');
    if (tx.type !== 'withdraw') throw new AppError('Transação não é um saque', 400);
    if (tx.user_id !== userId) throw new AppError('Acesso negado', 403);
    if (tx.status !== 'pending')
      throw new AppError('Apenas saques pendentes podem ser cancelados', 400);

    await db.transaction(async (trx) => {
      await UserRepository.updateBalance(userId, tx.amount, trx);
      await TransactionRepository.updateStatus(transactionId, 'cancelled', undefined, trx);
    });

    logger.info('Saque cancelado — saldo estornado', {
      transactionId,
      userId,
      amount: tx.amount,
    });
    return { message: 'Saque cancelado. Saldo estornado com sucesso.' };
  },

  async cancelDeposit(transactionId: string, userId: string) {
    const tx = await TransactionRepository.findById(transactionId);
    if (!tx) throw new NotFoundError('Transação não encontrada');
    if (tx.user_id !== userId) throw new AppError('Acesso negado', 403);
    if (tx.status !== 'pending')
      throw new AppError('Apenas transações pendentes podem ser canceladas');

    if (tx.external_id) {
      await MercadoPago.cancelPayment(tx.external_id);
    }
    await TransactionRepository.updateStatus(transactionId, 'cancelled');
    return { message: 'Cobrança cancelada com sucesso.' };
  },
};
