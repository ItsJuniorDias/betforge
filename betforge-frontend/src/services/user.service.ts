import { api } from './api';
import type { UserPublic, UserStats, UpdateProfilePayload, ApiSuccess } from '../types/api';

export const userService = {
  async getProfile(): Promise<UserPublic> {
    const { data } = await api.get<ApiSuccess<UserPublic>>('/users/profile');
    return data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserPublic> {
    const { data } = await api.patch<ApiSuccess<UserPublic>>('/users/profile', payload);
    return data.data;
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get<ApiSuccess<UserStats>>('/bets/stats');
    return data.data;
  },
};
