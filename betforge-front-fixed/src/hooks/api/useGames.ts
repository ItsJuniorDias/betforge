import { useQuery } from '@tanstack/react-query';
import {
  gamesService,
  toGameCardShape,
  toGameDetailShape,
  type GamesListParams,
} from '../../services/games.service';

export const GAMES_KEYS = {
  all: ['games'] as const,
  list: (params: GamesListParams) => ['games', 'list', params] as const,
  live: (sport?: string) => ['games', 'live', sport] as const,
  detail: (id: string) => ['games', id] as const,
  markets: (id: string) => ['games', id, 'markets'] as const,
};

// Todos os jogos (live + scheduled), opcionalmente filtrados
export function useGames(params: GamesListParams = {}) {
  return useQuery({
    queryKey: GAMES_KEYS.list(params),
    queryFn: () => gamesService.listGames(params),
    staleTime: 1000 * 30,       // revalida a cada 30s
    refetchInterval: 1000 * 30,
    select: (result) => ({
      ...result,
      data: result.data.map(toGameCardShape),
    }),
  });
}

// Somente ao vivo — refetch mais agressivo
export function useLiveGames(sport?: string) {
  return useQuery({
    queryKey: GAMES_KEYS.live(sport),
    queryFn: () => gamesService.getLiveGames(sport),
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 20,
    select: (data) => data.map(toGameCardShape),
  });
}

// Detalhe de um jogo — usa toGameDetailShape para expor markets_detail reais
export function useGameById(id: string) {
  return useQuery({
    queryKey: GAMES_KEYS.detail(id),
    queryFn: () => gamesService.getGameById(id),
    enabled: !!id,
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 20,
    // Aplica o adapter aqui para que a BettingPage receba o shape correto
    select: (data) => toGameDetailShape(data),
  });
}

// Só os mercados de um jogo (alternativa leve para a BettingPage)
export function useGameMarkets(id: string) {
  return useQuery({
    queryKey: GAMES_KEYS.markets(id),
    queryFn: () => gamesService.getGameMarkets(id),
    enabled: !!id,
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 20,
  });
}
