import type { Request, Response } from 'express';
import { formatResponse } from '../views/formatters/responseFormatter.js';

export class AIAuditController {
  public async dashboard(req: Request, res: Response): Promise<void> {
    const payload = {
      total: 3,
      decisions: ['approved', 'flagged', 'rejected'],
    };

    res.json(formatResponse(true, payload, 'Dados de auditoria carregados.'));
  }
}
