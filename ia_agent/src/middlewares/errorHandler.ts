import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.',
  });
};
