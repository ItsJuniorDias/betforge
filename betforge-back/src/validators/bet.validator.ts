import { z } from 'zod';

// ─── Aposta ───────────────────────────────────────────────────────────────────

const selectionSchema = z.object({
  // matchId pode ser UUID (jogos do banco) ou string livre (ex.: "live-1", "up-2")
  matchId: z.string().min(1, 'ID da partida obrigatório'),
  // marketId: UUID para mercados reais; string curta para mercados do BetPanel (ex.: "1x2", "over25")
  marketId: z.string().min(1),
  pick: z.string().min(1),
  label: z.string().min(1),
  odd: z.number().min(1.01).max(1000),
  matchLabel: z.string().min(1),
  marketLabel: z.string().min(1),
});

export const placeBetSchema = z.object({
  type: z.enum(['single', 'multiple']),
  stake: z
    .number()
    .positive('Valor da aposta deve ser positivo')
    .min(1, 'Valor mínimo é R$ 1,00')
    .max(100000, 'Valor máximo por aposta é R$ 100.000,00'),
  selections: z
    .array(selectionSchema)
    .min(1, 'Ao menos uma seleção é necessária')
    .max(20, 'Máximo de 20 seleções por aposta'),
});

// ─── Depósito ─────────────────────────────────────────────────────────────────

export const depositSchema = z.object({
  amount: z
    .number()
    .positive('Valor deve ser positivo')
    .min(10, 'Valor mínimo é R$ 10,00')
    .max(100000, 'Valor máximo é R$ 100.000,00'),
  method: z.enum(['pix', 'credit_card', 'boleto', 'crypto']),
  // Cartão de crédito (Pagar.me)
  cardToken: z.string().optional(),       // token one-time gerado pelo JS SDK Pagar.me
  cardId: z.string().optional(),          // card_id salvo (para usuários recorrentes)
  installments: z.number().int().min(1).max(12).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => {
    if (data.method === 'credit_card') {
      return !!(data.cardToken || data.cardId);
    }
    return true;
  },
  { message: 'cardToken ou cardId obrigatório para pagamento com cartão', path: ['cardToken'] }
);

// ─── Saque ────────────────────────────────────────────────────────────────────

export const withdrawSchema = z
  .object({
    amount: z
      .number()
      .positive('Valor deve ser positivo')
      .min(20, 'Valor mínimo para saque é R$ 20,00')
      .max(100000, 'Valor máximo é R$ 100.000,00'),
    method: z.enum(['pix', 'ted', 'crypto']),
    pixKey: z.string().optional(),
    pixKeyType: z.enum(['cpf', 'email', 'phone', 'random_key']).optional(),
    bankData: z
      .object({
        bank: z.string(),
        agency: z.string(),
        account: z.string(),
        accountType: z.enum(['checking', 'savings']),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'pix') return !!data.pixKey;
      if (data.method === 'ted') return !!data.bankData;
      return true;
    },
    { message: 'Dados de pagamento obrigatórios para o método selecionado' }
  );

// ─── Usuário ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
    .optional(),
  avatar_url: z.string().url().optional(),
});
