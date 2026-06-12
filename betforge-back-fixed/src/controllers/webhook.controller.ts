/**
 * Webhook Mercado Pago
 *
 * MUDANÇA: ao confirmar um depósito via webhook (status = 'approved'),
 * agora também seta withdraw_available_at = now + 3 dias na transação.
 * Isso implementa a regra de carência de 3 dias para saques.
 */

import type { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  TransactionRepository,
  WITHDRAW_LOCK_DAYS,
} from '../repositories/transaction.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { db } from '../config/database.js';
import * as MercadoPago from '../services/mercadopago.service.js';
import { NotificationService } from '../services/notification.service.js';

// ─── Verificação de Assinatura ────────────────────────────────────────────────

function verifySignature(req: Request): boolean {
  if (!env.MP_WEBHOOK_SECRET) {
    logger.warn('MP_WEBHOOK_SECRET não configurado — pulando verificação de assinatura');
    return true;
  }

  const xSignature = req.headers['x-signature'] as string;
  const xRequestId = req.headers['x-request-id'] as string;
  const dataId = req.query['data.id'] as string;

  if (!xSignature) return false;

  const parts: Record<string, string> = {};
  xSignature.split(',').forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  });

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const expected = crypto
    .createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcWithdrawAvailableAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + WITHDRAW_LOCK_DAYS);
  return d;
}

// ─── Handlers por Ação ────────────────────────────────────────────────────────

async function handlePaymentUpdated(paymentId: string) {
  const payment = await MercadoPago.getPayment(paymentId);
  const status: string = payment.status;
  const externalRef: string = payment.external_reference;

  let tx = await TransactionRepository.findByExternalId(paymentId);
  if (!tx && externalRef) {
    tx = await TransactionRepository.findById(externalRef);
  }

  if (!tx) {
    logger.warn('Webhook payment.updated: transação não encontrada', { paymentId, externalRef });
    return;
  }

  if (status === 'approved') {
    if (tx.status === 'completed') {
      logger.info('Webhook: transação já completada', { txId: tx.id });
      return;
    }

    // Calcula a data de liberação do saque (carência de 3 dias)
    const withdrawAvailableAt = calcWithdrawAvailableAt();

    await db.transaction(async (trx) => {
      await TransactionRepository.updateStatus(tx!.id, 'completed', new Date(), trx);
      // ↓ NOVO: marca quando o saldo poderá ser sacado
      await TransactionRepository.setWithdrawAvailableAt(
        tx!.id,
        withdrawAvailableAt,
        trx,
      );
      await UserRepository.updateBalance(tx!.user_id, tx!.amount, trx);
    });

    logger.info('Depósito confirmado via webhook — saque liberado em 3 dias', {
      txId: tx.id,
      userId: tx.user_id,
      amount: tx.amount,
      withdrawAvailableAt,
    });

    await NotificationService.notifyDepositConfirmed(
      tx.user_id,
      tx.amount,
      tx.method ?? 'pix',
    ).catch(() => null);

  } else if (status === 'rejected' || status === 'cancelled') {
    if (tx.status !== 'pending') return;
    await TransactionRepository.updateStatus(tx.id, 'failed', new Date());
    logger.info('Depósito falhou via webhook', { txId: tx.id, paymentId, status });
  }
}

async function handleDisbursementUpdated(disbursementId: string) {
  const tx = await TransactionRepository.findByExternalId(disbursementId);
  if (!tx) {
    logger.warn('Webhook disbursement: transação não encontrada', { disbursementId });
    return;
  }
  logger.info('Payout atualizado via webhook', { txId: tx.id, disbursementId });
}

async function handleDisbursementFailed(disbursementId: string) {
  const tx = await TransactionRepository.findByExternalId(disbursementId);
  if (!tx) {
    logger.warn('Webhook disbursement.failed: transação não encontrada', { disbursementId });
    return;
  }

  if (tx.status !== 'pending') return;

  // Estorna o saldo do usuário
  await db.transaction(async (trx) => {
    await TransactionRepository.updateStatus(tx.id, 'failed', new Date(), trx);
    await UserRepository.updateBalance(tx.user_id, tx.amount, trx); // devolve
  });

  logger.warn('Saque falhou — saldo estornado', {
    txId: tx.id,
    userId: tx.user_id,
    amount: tx.amount,
  });

  await NotificationService.notifyWithdrawFailed(tx.user_id, tx.amount).catch(() => null);
}

async function handleDisbursementCompleted(disbursementId: string) {
  const tx = await TransactionRepository.findByExternalId(disbursementId);
  if (!tx) return;
  if (tx.status === 'completed') return;

  await TransactionRepository.updateStatus(tx.id, 'completed', new Date());
  logger.info('Saque confirmado via webhook', { txId: tx.id });

  await NotificationService.notifyWithdrawCompleted(tx.user_id, tx.amount).catch(() => null);
}

// ─── Controller ───────────────────────────────────────────────────────────────

const ACTION_HANDLERS: Record<string, (id: string) => Promise<void>> = {
  'payment.created': handlePaymentUpdated,
  'payment.updated': handlePaymentUpdated,
  'disbursement.created': handleDisbursementUpdated,
  'disbursement.updated': handleDisbursementUpdated,
  'disbursement.failed': handleDisbursementFailed,
  'disbursement.completed': handleDisbursementCompleted,
};

export const WebhookController = {
  async mercadopago(req: Request, res: Response) {
    if (!verifySignature(req)) {
      logger.warn('Webhook com assinatura inválida');
      return res.status(401).json({ message: 'Assinatura inválida' });
    }

    const { action, data } = req.body as { action: string; data: { id: string } };
    const resourceId = data?.id ?? (req.query['data.id'] as string);

    logger.info('Webhook Mercado Pago recebido', { action, resourceId });

    const handler = ACTION_HANDLERS[action];

    if (!handler) {
      logger.info('Webhook ignorado (action não mapeada)', { action });
      return res.status(200).json({ received: true });
    }

    try {
      await handler(resourceId);
    } catch (err) {
      logger.error('Erro ao processar webhook', { action, resourceId, err });
    }

    return res.status(200).json({ received: true });
  },
};
