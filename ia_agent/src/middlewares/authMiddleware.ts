import type { NextFunction, Request, Response } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({ success: false, message: 'API key ausente.' });
    return;
  }

  next();
};
