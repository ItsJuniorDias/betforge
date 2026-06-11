import { api } from './api';
import type {
  Balance,
  Transaction,
  DepositPayload,
  WithdrawPayload,
  DepositResponse,
  WithdrawResponse,
  ApiSuccess,
  ApiPaginated,
} from '../types/api';

export interface TransactionsParams {
  page?: number;
  limit?: number;
  type?: string;
}

export const financialService = {
  async getBalance(): Promise<Balance> {
    const { data } = await api.get<ApiSuccess<Balance>>('/financial/balance');
    return data.data;
  },

  async getTransactions(params: TransactionsParams = {}) {
    const { data } = await api.get<ApiPaginated<Transaction>>('/financial/transactions', { params });
    return { data: data.data, meta: data.meta };
  },

  async deposit(payload: DepositPayload): Promise<DepositResponse> {
    const { data } = await api.post<ApiSuccess<DepositResponse>>('/financial/deposit', payload);
    return data.data;
  },

  async withdraw(payload: WithdrawPayload): Promise<WithdrawResponse> {
    const { data } = await api.post<ApiSuccess<WithdrawResponse>>('/financial/withdraw', payload);
    return data.data;
  },
};
