/**
 * PlayFiverService
 *
 * Integração com a API da PlayFiver (https://api.playfivers.com)
 *
 * Fluxo principal:
 *  1. listGames()      — lista jogos disponíveis (com cache Redis)
 *  2. launchGame()     — cria sessão e retorna URL para o iframe/redirect
 *  3. handleCallback() — processa callbacks de debit/credit da PlayFiver
 *
 * Variáveis de ambiente necessárias:
 *   PLAYFIVER_API_KEY   — chave de API fornecida pela PlayFiver
 *   PLAYFIVER_BASE_URL  — URL base (default: https://api.playfivers.com)
 *   PLAYFIVER_OPERATOR  — ID do operador (fornecido pela PlayFiver)
 *   PLAYFIVER_CALLBACK_URL — URL pública do seu servidor para callbacks
 */

import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

// ─── Tipos da PlayFiver ───────────────────────────────────────────────────────

export interface PFGame {
  id: string;
  name: string;
  provider: string;
  category: string;
  thumbnail: string;
  has_demo: boolean;
  rtp?: number;
  tags?: string[];
}

export interface PFGamesResponse {
  data: PFGame[];
  total: number;
  page: number;
  per_page: number;
}

export interface PFLaunchResponse {
  game_url: string;
  session_id: string;
  expires_at: string;
}

export interface PFCallbackPayload {
  action: 'debit' | 'credit' | 'rollback';
  session_id: string;
  player_id: string;
  game_id: string;
  round_id: string;
  amount: number;           // em centavos (integer)
  currency: string;
  transaction_id: string;
  reference_id?: string;    // presente em rollback, aponta pro transaction_id original
  timestamp: string;
}

export interface PFCallbackResponse {
  transaction_id: string;
  balance: number;          // saldo atual em centavos
  currency: string;
}

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const CACHE_GAMES_KEY = 'playfiver:games:all';
const CACHE_TTL_SECONDS = 300; // 5 minutos

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseUrl(): string {
  return env.PLAYFIVER_BASE_URL.replace(/\/$/, '');
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': env.PLAYFIVER_API_KEY,
    'X-Operator-Id': env.PLAYFIVER_OPERATOR_ID,
  };
}

async function pfFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('[PlayFiver] HTTP error', { status: res.status, url, body });
    throw new Error(`PlayFiver API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PlayFiverService = {

  /**
   * Lista todos os jogos disponíveis na plataforma.
   * Resultados são cacheados no Redis por CACHE_TTL_SECONDS.
   *
   * @param params.category  Filtra por categoria (slots, live, table, etc.)
   * @param params.provider  Filtra por provedor (pragmatic, pgsoft, etc.)
   * @param params.search    Busca por nome do jogo
   * @param params.page      Página (default 1)
   * @param params.limit     Itens por página (default 50, max 200)
   */
  async listGames(params: {
    category?: string;
    provider?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PFGamesResponse> {
    const { category, provider, search, page = 1, limit = 50 } = params;

    // Se não há filtros, tenta cache
    const useCache = !category && !provider && !search && page === 1;
    if (useCache) {
      try {
        const cached = await redis.get(CACHE_GAMES_KEY);
        if (cached) {
          logger.debug('[PlayFiver] listGames — cache hit');
          return JSON.parse(cached) as PFGamesResponse;
        }
      } catch (err) {
        logger.warn('[PlayFiver] Redis unavailable, bypassing cache', { err });
      }
    }

    const qs = new URLSearchParams({
      page: String(page),
      per_page: String(Math.min(limit, 200)),
    });
    if (category) qs.set('category', category);
    if (provider) qs.set('provider', provider);
    if (search)   qs.set('search', search);

    const data = await pfFetch<PFGamesResponse>(`/games?${qs.toString()}`);

    // Salva no cache apenas para query sem filtros
    if (useCache) {
      try {
        await redis.setEx(CACHE_GAMES_KEY, CACHE_TTL_SECONDS, JSON.stringify(data));
      } catch (err) {
        logger.warn('[PlayFiver] Falha ao salvar cache de jogos', { err });
      }
    }

    return data;
  },

  /**
   * Cria uma sessão de jogo e retorna a URL para abrir o jogo.
   *
   * @param userId   ID interno do usuário no BetForge
   * @param gameId   ID do jogo na PlayFiver
   * @param demo     Se true, abre em modo demo (sem dinheiro real)
   * @param locale   Idioma do jogo (default: pt-BR)
   */
  async launchGame(
    userId: string,
    gameId: string,
    demo = false,
    locale = 'pt-BR',
  ): Promise<PFLaunchResponse> {
    const payload = {
      player_id: userId,
      game_id: gameId,
      demo,
      locale,
      currency: 'BRL',
      callback_url: env.PLAYFIVER_CALLBACK_URL,
      return_url: env.PLAYFIVER_RETURN_URL || '',
    };

    logger.info('[PlayFiver] launchGame', { userId, gameId, demo });

    return pfFetch<PFLaunchResponse>('/games/launch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retorna os provedores disponíveis (útil para filtros no front).
   */
  async listProviders(): Promise<{ id: string; name: string; logo?: string }[]> {
    const cacheKey = 'playfiver:providers';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) { /* ignore */ }

    const data = await pfFetch<{ data: { id: string; name: string; logo?: string }[] }>('/providers');

    try {
      await redis.setEx(cacheKey, 3600, JSON.stringify(data.data)); // cache 1h
    } catch (_) { /* ignore */ }

    return data.data;
  },

  /**
   * Retorna as categorias disponíveis (slots, live, table, etc.).
   */
  async listCategories(): Promise<{ id: string; label: string }[]> {
    const cacheKey = 'playfiver:categories';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) { /* ignore */ }

    const data = await pfFetch<{ data: { id: string; label: string }[] }>('/categories');

    try {
      await redis.setEx(cacheKey, 3600, JSON.stringify(data.data));
    } catch (_) { /* ignore */ }

    return data.data;
  },

  /**
   * Invalida o cache de jogos (usar após atualizar configurações de RTP, etc.)
   */
  async invalidateCache(): Promise<void> {
    await redis.del(CACHE_GAMES_KEY);
    await redis.del('playfiver:providers');
    await redis.del('playfiver:categories');
    logger.info('[PlayFiver] Cache invalidado');
  },
};
