
import { Request, Response, NextFunction } from 'express'

const API_TOKEN_SECRET = process.env.AI_SECRET_TOKEN || 'ecowayer_secure_token_ai_2026'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Acesso recusado: token de acesso obrigatório.'
    })
    return
  }

  const tokenValue = authorizationHeader.split(' ')[1]

  if (tokenValue !== API_TOKEN_SECRET) {
    res.status(403).json({
      error: 'Acesso proibido: credencial de acesso inválida ou expirada.'
    })
    return
  }

  next()
}