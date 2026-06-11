import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { financialService } from '../../services/financial.service';
import { useAuth } from '../../context/AuthContext';
import type { UpdateProfilePayload } from '../../types/api';

export const USER_KEYS = {
  profile: ['user', 'profile'] as const,
  stats: ['user', 'stats'] as const,
  balance: ['user', 'balance'] as const,
};

export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USER_KEYS.profile,
    queryFn: userService.getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useUserStats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USER_KEYS.stats,
    queryFn: userService.getStats,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}

export function useBalance() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USER_KEYS.balance,
    queryFn: financialService.getBalance,
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30s — dado sensível, refresh frequente
    refetchInterval: 1000 * 60, // auto-refresh a cada 1 min
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_KEYS.profile, updatedUser);
      setUser(updatedUser);
    },
  });
}
