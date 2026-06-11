import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import * as Res from '../utils/response.js';

export const AuthController = {
  async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    return Res.created(res, result, 'Conta criada com sucesso!');
  },

  async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    return Res.success(res, result, 'Login realizado com sucesso!');
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshTokens(refreshToken);
    return Res.success(res, tokens, 'Token renovado com sucesso!');
  },

  async logout(req: Request, res: Response) {
    await AuthService.logout(req.user!.sub);
    return Res.noContent(res);
  },

  async me(req: Request, res: Response) {
    const { sub, email, role } = req.user!;
    return Res.success(res, { id: sub, email, role });
  },
};
