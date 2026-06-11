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
    staleTime: 1000 * 30,
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepositPayload) => financialService.deposit(payload),
    onSuccess: (_res: DepositResponse) => {
      // Invalida queries — o saldo só sobe após webhook confirmar (PIX/boleto)
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
      queryClient.setQueryData(USER_KEYS.balance, {
        balance: res.newBalance,
        bonusBalance: 0,
        total: res.newBalance,
      });
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
    },
  });
}
