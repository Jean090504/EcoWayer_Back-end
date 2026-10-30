import type { Request, Response } from 'express';
import { formatResponse } from '../views/formatters/responseFormatter.js';

export class AIRetrainingController {
  public async enqueueCorrections(req: Request, res: Response): Promise<void> {
    const payload = {
      queued: Array.isArray(req.body?.corrections) ? req.body.corrections.length : 0,
      status: 'queued',
    };

    res.json(formatResponse(true, payload, 'Correções enviadas para treinamento.'));
  }
}
