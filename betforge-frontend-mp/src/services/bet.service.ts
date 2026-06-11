import { api } from './api';
import type {
  Bet,
  PlaceBetPayload,
  ApiSuccess,
  ApiPaginated,
  UserStats,
} from '../types/api';

export interface BetsListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const betService = {
  async placeBet(payload: PlaceBetPayload): Promise<Bet> {
    const { data } = await api.post<ApiSuccess<Bet>>('/bets', payload);
    return data.data;
  },

  async listBets(params: BetsListParams = {}): Promise<ApiPaginated<Bet>['data'] extends infer T ? { data: T; meta: ApiPaginated<Bet>['meta'] } : never> {
    const { data } = await api.get<ApiPaginated<Bet>>('/bets', { params });
    return { data: data.data, meta: data.meta };
  },

  async getBetById(id: string): Promise<Bet> {
    const { data } = await api.get<ApiSuccess<Bet>>(`/bets/${id}`);
    return data.data;
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get<ApiSuccess<UserStats>>('/bets/stats');
    return data.data;
  },
};
