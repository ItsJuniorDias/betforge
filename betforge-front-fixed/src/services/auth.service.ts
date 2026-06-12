import { api } from './api';
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  ApiSuccess,
  AuthTokens,
} from '../types/api';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
    return data.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<ApiSuccess<AuthTokens>>('/auth/refresh', { refreshToken });
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me() {
    const { data } = await api.get<ApiSuccess<{ id: string; email: string; role: string }>>('/auth/me');
    return data.data;
  },
};
