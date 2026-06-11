import axios from 'axios';
import type { ApiError } from '../types/api';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Helpers de token ─────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => localStorage.getItem('betforge:accessToken'),
  getRefresh: () => localStorage.getItem('betforge:refreshToken'),
  set: (access: string, refresh: string) => {
    localStorage.setItem('betforge:accessToken', access);
    localStorage.setItem('betforge:refreshToken', refresh);
  },
  clear: () => {
    localStorage.removeItem('betforge:accessToken');
    localStorage.removeItem('betforge:refreshToken');
  },
};

// ─── Request interceptor — injeta token ───────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — auto-refresh em 401 ──────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = data.data;
        tokenStorage.set(accessToken, newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helper para extrair mensagem de erro ─────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) return data.message;
    if (error.message === 'Network Error') return 'Sem conexão com o servidor.';
    if (error.code === 'ECONNABORTED') return 'Tempo de resposta esgotado.';
  }
  return 'Erro inesperado. Tente novamente.';
}
