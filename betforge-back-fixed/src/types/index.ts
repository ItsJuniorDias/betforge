// ─── Usuário ─────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin" | "affiliate";
export type UserStatus = "active" | "suspended" | "pending_verification";
export type KycStatus = "pending" | "verified" | "rejected";
export type UserLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthdate: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  kyc_status: KycStatus;
  level: UserLevel;
  balance: number;
  bonus_balance: number;
  avatar_url?: string;
  email_verified_at?: Date;
  phone_verified_at?: Date;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, "password_hash" | "cpf">;

// ─── Apostas ──────────────────────────────────────────────────────────────────

export type BetType = "single" | "multiple" | "system";
export type BetStatus = "pending" | "won" | "lost" | "cancelled" | "cashed_out";
export type SelectionStatus = "pending" | "won" | "lost" | "cancelled" | "void";

export interface BetSelection {
  id: string;
  bet_id: string;
  match_id: string; // UUID ou ID externo (ex: "live-1")
  market_id: string;
  pick: string;
  odd: number;
  status: SelectionStatus;
  match_label: string;
  market_label: string;
  created_at: Date;
}

export interface Bet {
  id: string;
  user_id: string;
  type: BetType;
  status: BetStatus;
  stake: number;
  potential_payout: number;
  actual_payout?: number;
  total_odd: number;
  settled_at?: Date;
  created_at: Date;
  updated_at: Date;
  selections?: BetSelection[];
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "bet_stake"
  | "bet_win"
  | "bet_refund"
  | "bonus";
export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";
export type PaymentMethod = "pix" | "credit_card" | "boleto" | "crypto" | "ted";

// ─── Jogos / Mercados ─────────────────────────────────────────────────────────

export type Sport =
  | "football"
  | "basketball"
  | "tennis"
  | "mma"
  | "esports"
  | "baseball"
  | "hockey"
  | "americanfootball";
export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "cancelled"
  | "postponed";

export interface Match {
  id: string;
  sport: Sport;
  league_id: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status: MatchStatus;
  starts_at: Date;
  minute?: number;
  period?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Market {
  id: string;
  match_id: string;
  label: string;
  type: string;
  is_active: boolean;
  created_at: Date;
}

export interface Odd {
  id: string;
  market_id: string;
  pick: string;
  label: string;
  value: number;
  is_active: boolean;
  updated_at: Date;
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "bet_settled"
  | "deposit_confirmed"
  | "withdraw_processed"
  | "promotion"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at?: Date;
}

// ─── Paginação ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Financeiro (Transaction) ────────────────────────────────────────────────

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  method?: PaymentMethod;
  external_id?: string;
  metadata?: Record<string, unknown>;
  processed_at?: Date;
  // ↓ NOVO — data a partir da qual o depósito pode ser sacado (null = sem carência)
  withdraw_available_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
