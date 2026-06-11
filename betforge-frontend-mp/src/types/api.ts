// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthdate: string; // YYYY-MM-DD
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'affiliate';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';
export type KycStatus = 'pending' | 'verified' | 'rejected';
export type UserLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  role: UserRole;
  status: UserStatus;
  kyc_status: KycStatus;
  level: UserLevel;
  balance: number;
  bonus_balance: number;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  balance: number;
  bonusBalance: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  totalStaked: number;
  totalWon: number;
  totalDeposited: number;
  totalWithdrawn: number;
  profitLoss: number;
  winRate: number;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

// ─── Bets ─────────────────────────────────────────────────────────────────────

export type BetType = 'single' | 'multiple';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'cashed_out';
export type SelectionStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'void';

export interface BetSelection {
  id: string;
  bet_id: string;
  match_id: string;
  market_id: string;
  pick: string;
  label: string;
  odd: number;
  status: SelectionStatus;
  match_label: string;
  market_label: string;
  created_at: string;
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
  settled_at?: string;
  created_at: string;
  updated_at: string;
  selections: BetSelection[];
}

export interface PlaceBetSelectionPayload {
  matchId: string;
  marketId: string;
  pick: string;
  label: string;
  odd: number;
  matchLabel: string;
  marketLabel: string;
}

export interface PlaceBetPayload {
  type: BetType;
  stake: number;
  selections: PlaceBetSelectionPayload[];
}

// ─── Financial ────────────────────────────────────────────────────────────────

export type TransactionType = 'deposit' | 'withdraw' | 'bet_stake' | 'bet_win' | 'bet_refund' | 'bonus';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'crypto' | 'ted';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  method?: PaymentMethod;
  external_id?: string;
  metadata?: Record<string, unknown>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Balance {
  balance: number;
  bonusBalance: number;
  total: number;
}

// ─── Mercado Pago — Dados retornados pelo backend após criar payment ──────────

export interface PixPaymentData {
  paymentId: number;
  qrCode: string;         // string copia e cola
  qrCodeBase64: string;   // imagem base64 para renderizar como <img>
  ticketUrl: string;      // link do QR no site do MP (fallback)
  expiresAt: string;
}

export interface BoletoPaymentData {
  paymentId: number;
  boletoLine: string;     // linha digitável (barcode.content)
  boletoPdf: string;      // URL do PDF / boleto online
  dueAt: string;
}

export interface CreditCardPaymentData {
  paymentId: number;
  status: string;
  statusDetail: string;
  paymentMethodId?: string; // 'visa', 'master', 'elo', etc.
  lastFour?: string;
  installments?: number;
  approved: boolean;
}

export type PaymentData = PixPaymentData | BoletoPaymentData | CreditCardPaymentData | null;

// ─── Payloads de Depósito ─────────────────────────────────────────────────────

export interface DepositPayloadBase {
  amount: number;
  method: 'pix' | 'credit_card' | 'boleto' | 'crypto';
  metadata?: Record<string, unknown>;
}

export interface DepositPixPayload extends DepositPayloadBase {
  method: 'pix';
}

export interface DepositBoletoPayload extends DepositPayloadBase {
  method: 'boleto';
}

export interface DepositCreditCardPayload extends DepositPayloadBase {
  method: 'credit_card';
  cardToken?: string;       // token gerado pelo MercadoPago.js
  installments?: number;
  issuerId?: string;        // emissora retornada pelo MP ao consultar o bin
}

export type DepositPayload =
  | DepositPixPayload
  | DepositBoletoPayload
  | DepositCreditCardPayload
  | DepositPayloadBase;

// ─── Payloads de Saque ────────────────────────────────────────────────────────

export interface WithdrawPayload {
  amount: number;
  method: 'pix' | 'ted' | 'crypto';
  pixKey?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random_key';
  bankData?: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'checking' | 'savings';
  };
}

// ─── Respostas do Backend ─────────────────────────────────────────────────────

export interface DepositResponse {
  transaction: {
    id: string;
    method: PaymentMethod;
    amount: number;
    status: TransactionStatus;
  };
  paymentData: Record<string, unknown>;
  message: string;
}

export interface WithdrawResponse {
  transaction: {
    id: string;
    method: PaymentMethod;
    amount: number;
    status: TransactionStatus;
  };
  message: string;
  newBalance: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}
