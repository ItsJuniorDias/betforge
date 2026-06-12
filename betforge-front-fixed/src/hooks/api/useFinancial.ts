import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type TransactionsParams } from '../../services/financial.service';
import { useAuth } from '../../context/AuthContext';
import { USER_KEYS } from './useUser';
import type { DepositPayload, WithdrawPayload, DepositResponse } from '../../types/api';

export const FINANCIAL_KEYS = {
  balance: ['financial', 'balance'] as const,
  transactions: (params: TransactionsParams) => ['financial', 'transactions', params] as const,
};

export function useTransactions(params: TransactionsParams = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCIAL_KEYS.transactions(params),
    queryFn: () => financialService.getTransactions(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30s — dados financeiros precisam ser frescos
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepositPayload) => financialService.deposit(payload),
    onSuccess: (_res: DepositResponse) => {
      // Invalida saldo e transações — o saldo sobe após webhook confirmar (PIX/boleto)
      // Para cartão aprovado sincronamente, o backend já creditou
      queryClient.invalidateQueries({ queryKey: USER_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ['financial', 'transactions'] });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawPayload) => financialService.withdraw(payload),
    onSuccess: (res) => {
      // Atualiza saldo otimisticamente e invalida as queries
      queryClient.setQueryData(USER_KEYS.balance, (old: any) => ({
        ...(old ?? {}),
        balance: res.newBalance,
        total: res.newBalance + (old?.bonusBalance ?? 0),
      }));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ['financial', 'transactions'] });
    },
  });
}

export function useCancelDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => financialService.cancelDeposit(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.balance });
    },
  });
}
