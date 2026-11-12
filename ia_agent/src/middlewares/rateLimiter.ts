
import { Request, Response, NextFunction } from 'express'

interface IUserRateProfile {
  requestTimestamps: number[]
}

const userRequestRecords = new Map<string, IUserRateProfile>()
const MAX_REQUESTS_PER_MINUTE = 30 // Limite calibrado para evitar custos desproporcionados 
const ONE_MINUTE_IN_MS = 60 * 1000

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Identificação do requisitante por cabeçalho autenticado ou endereço IP
  const userIdentifier = (req.headers['x-user-id'] as string) || req.ip || 'anonymous-client'
  const currentTime = Date.now()

  const userProfile = userRequestRecords.get(userIdentifier) || { requestTimestamps: [] }

  const activeTimestamps = userProfile.requestTimestamps.filter(
    timestamp => currentTime - timestamp < ONE_MINUTE_IN_MS
  )

  // Trava para limitar pedidos por minuto por utilizador
  if (activeTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = activeTimestamps[0]
    const waitTimeSeconds = Math.ceil((ONE_MINUTE_IN_MS - (currentTime - oldestTimestamp)) / 1000)

    res.status(429).json({
      error: 'Limite de pedidos por minuto por utilizador excedidos.',
      retryAfterSeconds: waitTimeSeconds,
      limit: MAX_REQUESTS_PER_MINUTE
    })
    return
  }

  // Regista a requisição atual
  activeTimestamps.push(currentTime)
  userRequestRecords.set(userIdentifier, { requestTimestamps: activeTimestamps })

  next()
}