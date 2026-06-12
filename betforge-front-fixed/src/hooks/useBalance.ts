// src/hooks/api/useUser.ts (substituir o hook useBalance existente)
//
// A única mudança é que agora useBalance busca o endpoint /financial/balance
// (em vez de /user/balance) para ter acesso a withdrawableBalance e lockedDeposits.
// Se o seu useBalance já usa /financial/balance, apenas garanta que o tipo
// retornado está atualizado com a interface Balance do patch.

import { useQuery } from "@tanstack/react-query";
import { financialService } from "../services/financial.service";
import { useAuth } from "../context/AuthContext";

export const USER_KEYS = {
  balance: ["user", "balance"] as const,
  profile: ["user", "profile"] as const,
};

/** Retorna saldo completo incluindo withdrawableBalance e lockedDeposits */
export function useBalance() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: USER_KEYS.balance,
    queryFn: () => financialService.getBalance(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 segundos
  });
}
