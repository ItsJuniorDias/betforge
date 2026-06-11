import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { NotFoundError } from '../utils/errors.js';
import * as Res from '../utils/response.js';

export const UserController = {
  async getProfile(req: Request, res: Response) {
    const user = await UserRepository.findById(req.user!.sub);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return Res.success(res, UserRepository.toPublic(user));
  },

  async updateProfile(req: Request, res: Response) {
    const { name, phone, avatar_url } = req.body;
    const user = await UserRepository.update(req.user!.sub, { name, phone, avatar_url });
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return Res.success(res, UserRepository.toPublic(user), 'Perfil atualizado com sucesso!');
  },

  // Admin only
  async listAll(req: Request, res: Response) {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await UserRepository.findAll({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
    });
    return Res.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },
};
