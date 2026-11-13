
import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Acesso recusado: token de acesso obrigatório.'
    })
    return
  }

  const tokenValue = authorizationHeader.split(' ')[1]

  if (!env.AI_SECRET_TOKEN || tokenValue !== env.AI_SECRET_TOKEN) {
    res.status(403).json({
      error: 'Acesso proibido: credencial de acesso inválida ou expirada.'
    })
    return
  }

  next()
}
