import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/user.repository.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';
import type { User, JwtPayload } from '../types/index.js';

interface RegisterDTO {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthdate: string;
  password: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias

export const AuthService = {
  async register(dto: RegisterDTO): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
    const emailExists = await UserRepository.findByEmail(dto.email);
    if (emailExists) throw new ConflictError('E-mail já cadastrado');

    const cpfExists = await UserRepository.findByCpf(dto.cpf.replace(/\D/g, ''));
    if (cpfExists) throw new ConflictError('CPF já cadastrado');

    const password_hash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    const user = await UserRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      cpf: dto.cpf.replace(/\D/g, ''),
      phone: dto.phone.replace(/\D/g, ''),
      birthdate: dto.birthdate,
      password_hash,
      role: 'user',
      status: 'active',
      kyc_status: 'pending',
      level: 'bronze',
      balance: 0,
      bonus_balance: 0,
    });

    const tokens = await AuthService.generateTokens(user);
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  },

  async login(dto: LoginDTO): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
    const user = await UserRepository.findByEmail(dto.email.toLowerCase());
    if (!user) throw new UnauthorizedError('Credenciais inválidas');

    if (user.status === 'suspended') {
      throw new UnauthorizedError('Conta suspensa. Entre em contato com o suporte.');
    }

    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid) throw new UnauthorizedError('Credenciais inválidas');

    await UserRepository.update(user.id, { last_login_at: new Date() });

    const tokens = await AuthService.generateTokens(user);
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  },

  async refreshTokens(token: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Refresh token inválido ou expirado');
    }

    const stored = await redis.get(`${REFRESH_TOKEN_PREFIX}${payload.sub}`);
    if (!stored || stored !== token) {
      throw new UnauthorizedError('Refresh token não reconhecido');
    }

    const user = await UserRepository.findById(payload.sub);
    if (!user) throw new NotFoundError('Usuário não encontrado');

    return AuthService.generateTokens(user);
  },

  async logout(userId: string): Promise<void> {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
  },

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    await redis.set(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 dias em segundos
    };
  },
};
