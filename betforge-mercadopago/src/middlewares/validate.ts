import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new ValidationError(errors);
    }

    req[target] = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.errors.reduce(
    (acc, err) => {
      const key = err.path.join('.');
      acc[key] = acc[key] ? [...acc[key], err.message] : [err.message];
      return acc;
    },
    {} as Record<string, string[]>
  );
}
