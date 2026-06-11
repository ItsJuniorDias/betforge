import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dos repositórios
vi.mock('../../src/repositories/bet.repository.js', () => ({
  BetRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    settle: vi.fn(),
    countByUser: vi.fn(),
  },
}));

vi.mock('../../src/repositories/user.repository.js', () => ({
  UserRepository: {
    findById: vi.fn(),
    updateBalance: vi.fn(),
    toPublic: vi.fn(),
  },
}));

vi.mock('../../src/repositories/transaction.repository.js', () => ({
  TransactionRepository: {
    create: vi.fn(),
    sumByUserAndType: vi.fn(),
  },
}));

vi.mock('../../src/config/database.js', () => ({
  db: {
    transaction: vi.fn((cb) => cb({})),
  },
}));

import { BetService } from '../../src/services/bet.service.js';
import { BetRepository } from '../../src/repositories/bet.repository.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { InsufficientBalanceError, AppError } from '../../src/utils/errors.js';

describe('BetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('placeBet', () => {
    const validDto = {
      userId: 'user-uuid',
      type: 'single' as const,
      stake: 50,
      selections: [
        {
          matchId: '550e8400-e29b-41d4-a716-446655440000',
          marketId: 'market-1',
          pick: 'home',
          label: 'Flamengo',
          odd: 2.1,
          matchLabel: 'Flamengo vs Corinthians',
          marketLabel: 'Resultado Final',
        },
      ],
    };

    it('deve rejeitar quando saldo é insuficiente', async () => {
      (UserRepository.findById as any).mockResolvedValue({
        id: 'user-uuid',
        balance: 10,
        status: 'active',
      });

      await expect(BetService.placeBet(validDto)).rejects.toThrow(
        InsufficientBalanceError
      );
    });

    it('deve rejeitar aposta com stake menor que 1', async () => {
      const dto = { ...validDto, stake: 0.5 };

      (UserRepository.findById as any).mockResolvedValue({
        id: 'user-uuid',
        balance: 1000,
      });

      await expect(BetService.placeBet(dto)).rejects.toThrow(AppError);
    });

    it('deve rejeitar odd inválida', async () => {
      const dto = {
        ...validDto,
        selections: [{ ...validDto.selections[0], odd: 0.5 }],
      };

      (UserRepository.findById as any).mockResolvedValue({
        id: 'user-uuid',
        balance: 1000,
      });

      await expect(BetService.placeBet(dto)).rejects.toThrow(AppError);
    });

    it('deve rejeitar múltipla com apenas 1 seleção', async () => {
      const dto = { ...validDto, type: 'multiple' as const };

      (UserRepository.findById as any).mockResolvedValue({
        id: 'user-uuid',
        balance: 1000,
      });

      await expect(BetService.placeBet(dto)).rejects.toThrow(AppError);
    });
  });
});
