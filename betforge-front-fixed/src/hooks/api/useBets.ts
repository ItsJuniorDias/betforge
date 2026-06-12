import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { betService, type BetsListParams } from '../../services/bet.service';
import { useAuth } from '../../context/AuthContext';
import { USER_KEYS } from './useUser';
import type { PlaceBetPayload } from '../../types/api';

export const BET_KEYS = {
  all: ['bets'] as const,
  list: (params: BetsListParams) => ['bets', 'list', params] as const,
  detail: (id: string) => ['bets', id] as const,
  stats: ['bets', 'stats'] as const,
};

export function useBets(params: BetsListParams = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: BET_KEYS.list(params),
    queryFn: () => betService.listBets(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    // Revalida automaticamente quando o usuário volta para a aba
    refetchOnWindowFocus: true,
  });
}

export function useBetById(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: BET_KEYS.detail(id),
    queryFn: () => betService.getBetById(id),
    enabled: isAuthenticated && !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useBetStats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: BET_KEYS.stats,
    queryFn: betService.getStats,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    // Revalida ao focar — saldo pode ter mudado por settlement automático
    refetchOnWindowFocus: true,
  });
}

export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlaceBetPayload) => betService.placeBet(payload),
    onSuccess: (newBet) => {
      // Invalidar lista de apostas e saldo (foi debitado)
      queryClient.invalidateQueries({ queryKey: BET_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.stats });
      // Pré-popular cache do detalhe da nova aposta
      queryClient.setQueryData(BET_KEYS.detail(newBet.id), newBet);
    },
  });
}
