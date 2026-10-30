import type { Request, Response } from 'express';
import { formatResponse } from '../views/formatters/responseFormatter.js';

export class ModerationController {
  public async reviewMessage(req: Request, res: Response): Promise<void> {
    const payload = {
      messageId: req.body?.messageId ?? 'msg_001',
      status: 'approved',
      moderated: true,
    };

    res.json(formatResponse(true, payload, 'Mensagem revisada com sucesso.'));
  }
}
