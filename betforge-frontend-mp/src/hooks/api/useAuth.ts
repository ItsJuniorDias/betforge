import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../services/api';
import type { LoginPayload, RegisterPayload } from '../../types/api';

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => navigate('/'),
  });
}

export function useRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: () => navigate('/'),
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => navigate('/login'),
  });
}

export { getApiError };
