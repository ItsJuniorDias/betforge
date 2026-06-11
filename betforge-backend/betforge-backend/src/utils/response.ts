import type { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function success<T>(
  res: Response,
  data: T,
  message = 'Sucesso',
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function created<T>(res: Response, data: T, message = 'Criado com sucesso') {
  return success(res, data, message, 201);
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Sucesso'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function noContent(res: Response) {
  return res.status(204).send();
}
