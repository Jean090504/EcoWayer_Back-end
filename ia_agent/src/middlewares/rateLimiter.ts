import type { NextFunction, Request, Response } from 'express';

const windowMs = 60 * 1000;
const maxRequests = 100;
const requestMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? 'anonymous';
  const now = Date.now();
  const record = requestMap.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  if (record.count >= maxRequests) {
    res.status(429).json({ success: false, message: 'Limite de requisições excedido.' });
    return;
  }

  record.count += 1;
  requestMap.set(key, record);
  next();
};
