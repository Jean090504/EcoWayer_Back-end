import type { Request, Response } from 'express';
import { formatResponse } from '../views/formatters/responseFormatter.js';

export class ListingAIController {
  public async classify(req: Request, res: Response): Promise<void> {
    const payload = {
      listingId: req.body?.listingId ?? 'listing_001',
      category: 'papel',
      confidence: 0.96,
      status: 'approved',
    };

    res.json(formatResponse(true, payload, 'Anúncio classificado com sucesso.'));
  }
}
