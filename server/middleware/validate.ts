import { ZodSchema } from 'zod';
import type { Request, Response } from 'express';

type Next = (err?: any) => void;
export function validate<T extends ZodSchema<any>>(schema: T) {
  return (req: Request, res: Response, next: Next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'validation_failed', details: result.error.flatten() });
    }
    // attach parsed data back for typed downstream usage if desired
    (req as any).validated = result.data;
    next();
  };
}
