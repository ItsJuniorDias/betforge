# BetForge Frontend — Integração com TanStack Query

## O que foi integrado

### Autenticação
- `Loginpage.tsx` → `useLogin()` → `POST /api/v1/auth/login`
- `Registerpage.tsx` → `useRegister()` → `POST /api/v1/auth/register`
- `AuthContext.tsx` → gerencia estado global do usuário logado + refresh automático
- `ProtectedRoute.tsx` → redireciona para `/login` se não autenticado

### Saldo e Perfil (Header sempre atualizado)
- `Header.jsx` → `useBalance()` + `useAuth()` → saldo e initials reais
- `AccountPage.jsx` → `useProfile()`, `useUserStats()`, `useUpdateProfile()`

### Apostas
- `BetSlip.jsx` → `usePlaceBet()` → `POST /api/v1/bets` com invalidação automática de cache
- `Historypage.tsx` → `useBets()` + `useBetStats()` → paginação real
- `Betdetailpage.tsx` → `useBetById()` → detalhes com selections reais

### Financeiro
- `Depositpage.tsx` → `useDeposit()` → `POST /api/v1/financial/deposit`
- `Withdrawpage.tsx` → `useWithdraw()` → `POST /api/v1/financial/withdraw`
- Saldo atualizado no cache automaticamente após cada operação

## Arquitetura de hooks

```
src/
├── services/
│   ├── api.ts          ← Axios + interceptors JWT + auto-refresh
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── bet.service.ts
│   └── financial.service.ts
├── hooks/api/
│   ├── useAuth.ts      ← useLogin, useRegister, useLogout
│   ├── useUser.ts      ← useProfile, useBalance, useUserStats, useUpdateProfile
│   ├── useBets.ts      ← useBets, useBetById, useBetStats, usePlaceBet
│   └── useFinancial.ts ← useDeposit, useWithdraw, useTransactions
├── context/
│   └── AuthContext.tsx  ← estado global do usuário + restauração de sessão
└── types/
    └── api.ts           ← interfaces espelhando exatamente o backend
```

## Setup

```bash
npm install
cp .env.local .env.local   # VITE_API_URL já configurado
npm run dev
```

> O backend precisa estar rodando em `http://localhost:3333`
