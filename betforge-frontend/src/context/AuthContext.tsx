import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../services/api';
import type { UserPublic, LoginPayload, RegisterPayload } from '../types/api';

interface AuthContextValue {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Restaurar sessão ao carregar
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .me()
      .then(() => {
        // token válido — buscar perfil completo
        return import('../services/user.service').then((m) => m.userService.getProfile());
      })
      .then((profile) => setUser(profile))
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user, tokens } = await authService.login(payload);
    tokenStorage.set(tokens.accessToken, tokens.refreshToken);
    setUser(user);
    queryClient.clear();
  }, [queryClient]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user, tokens } = await authService.register(payload);
    tokenStorage.set(tokens.accessToken, tokens.refreshToken);
    setUser(user);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // silencia erros de logout
    } finally {
      tokenStorage.clear();
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
