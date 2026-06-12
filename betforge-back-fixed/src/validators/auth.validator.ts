import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100),
  email: z.string().email('E-mail inválido').toLowerCase(),
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido'),
  phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)')
    .refine((date) => {
      const birth = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      return age >= 18;
    }, 'Você deve ter ao menos 18 anos'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});
