/**
 * NotificationService
 *
 * Cria notificações nos eventos principais da plataforma:
 *  - aposta colocada (pending)
 *  - aposta liquidada (won / lost)
 *  - depósito confirmado
 *  - saque solicitado / processado / falhou
 *  - promoção (uso genérico)
 *  - sistema (uso genérico)
 */

import {
  NotificationRepository,
  type CreateNotificationData,
} from '../repositories/notification.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { NotificationType, PaginationParams } from '../types/index.js';

// ─── helpers de formatação ────────────────────────────────────────────────────

function brl(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// ─── serviço ──────────────────────────────────────────────────────────────────

export const NotificationService = {
  /** Cria uma notificação genérica — use os helpers abaixo sempre que possível. */
  async create(data: CreateNotificationData) {
    try {
      return await NotificationRepository.create(data);
    } catch (err) {
      // Nunca deixar uma falha de notificação derrubar o fluxo principal
      logger.error('Falha ao criar notificação', { err, data });
      return null;
    }
  },

  // ─── eventos de apostas ────────────────────────────────────────────────────

  async notifyBetPlaced(userId: string, stake: number, betId: string) {
    return NotificationService.create({
      user_id: userId,
      type: 'bet_settled',
      title: 'Aposta registrada ⏳',
      message: `Sua aposta de ${brl(stake)} foi confirmada e está em andamento.`,
      metadata: { bet_id: betId, event: 'bet_placed' },
    });
  },

  async notifyBetWon(
    userId: string,
    payout: number,
    matchLabel: string,
    betId: string,
  ) {
    return NotificationService.create({
      user_id: userId,
      type: 'bet_settled',
      title: 'Aposta Ganha! 🎉',
      message: `${matchLabel} — sua aposta foi premiada com ${brl(payout)}.`,
      metadata: { bet_id: betId, payout, event: 'bet_won' },
    });
  },

  async notifyBetLost(
    userId: string,
    stake: number,
    matchLabel: string,
    betId: string,
  ) {
    return NotificationService.create({
      user_id: userId,
      type: 'bet_settled',
      title: 'Resultado da sua aposta',
      message: `${matchLabel} — sua aposta de ${brl(stake)} não foi premiada desta vez.`,
      metadata: { bet_id: betId, stake, event: 'bet_lost' },
    });
  },

  // ─── eventos financeiros ───────────────────────────────────────────────────

  async notifyDepositConfirmed(userId: string, amount: number, method: string) {
    const methodLabel: Record<string, string> = {
      pix: 'Pix',
      credit_card: 'Cartão de Crédito',
      boleto: 'Boleto',
      crypto: 'Crypto',
      ted: 'TED',
    };
    return NotificationService.create({
      user_id: userId,
      type: 'deposit_confirmed',
      title: 'Depósito confirmado ✅',
      message: `Seu depósito via ${methodLabel[method] ?? method} de ${brl(amount)} foi processado com sucesso.`,
      metadata: { amount, method, event: 'deposit_confirmed' },
    });
  },

  async notifyDepositPending(userId: string, amount: number, method: string) {
    return NotificationService.create({
      user_id: userId,
      type: 'deposit_confirmed',
      title: 'Depósito em processamento',
      message: `Depósito de ${brl(amount)} aguardando confirmação do pagamento.`,
      metadata: { amount, method, event: 'deposit_pending' },
    });
  },

  async notifyWithdrawRequested(userId: string, amount: number, method: string) {
    return NotificationService.create({
      user_id: userId,
      type: 'withdraw_processed',
      title: 'Saque solicitado 🏦',
      message: `Saque de ${brl(amount)} via ${method.toUpperCase()} foi solicitado e está sendo processado.`,
      metadata: { amount, method, event: 'withdraw_requested' },
    });
  },

  async notifyWithdrawCompleted(userId: string, amount: number) {
    return NotificationService.create({
      user_id: userId,
      type: 'withdraw_processed',
      title: 'Saque aprovado ✅',
      message: `Seu saque de ${brl(amount)} foi processado com sucesso.`,
      metadata: { amount, event: 'withdraw_completed' },
    });
  },

  async notifyWithdrawFailed(userId: string, amount: number) {
    return NotificationService.create({
      user_id: userId,
      type: 'withdraw_processed',
      title: 'Saque não processado ❌',
      message: `Não foi possível processar seu saque de ${brl(amount)}. O saldo foi estornado automaticamente.`,
      metadata: { amount, event: 'withdraw_failed' },
    });
  },

  // ─── promoções / sistema ───────────────────────────────────────────────────

  async notifyPromotion(userId: string, title: string, message: string, metadata?: Record<string, unknown>) {
    return NotificationService.create({
      user_id: userId,
      type: 'promotion',
      title,
      message,
      metadata: { ...metadata, event: 'promotion' },
    });
  },

  async notifySystem(userId: string, title: string, message: string, metadata?: Record<string, unknown>) {
    return NotificationService.create({
      user_id: userId,
      type: 'system',
      title,
      message,
      metadata: { ...metadata, event: 'system' },
    });
  },

  // ─── leitura e gestão ──────────────────────────────────────────────────────

  async getUserNotifications(
    userId: string,
    params: PaginationParams & { unread_only?: boolean },
  ) {
    return NotificationRepository.findByUserId(userId, params);
  },

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationRepository.countUnread(userId);
  },

  async markRead(id: string, userId: string): Promise<void> {
    const ok = await NotificationRepository.markRead(id, userId);
    if (!ok) throw new NotFoundError('Notificação não encontrada');
  },

  async markAllRead(userId: string): Promise<void> {
    await NotificationRepository.markAllRead(userId);
  },

  async dismiss(id: string, userId: string): Promise<void> {
    const ok = await NotificationRepository.delete(id, userId);
    if (!ok) throw new NotFoundError('Notificação não encontrada');
  },
};
