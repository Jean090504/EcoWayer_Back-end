
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production'
  const timestamp = new Date().toISOString()

  // Tratamento específico para limites de upload do Multer 
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'O ficheiro de imagem excede o tamanho limite estipulado de 10 MB.',
        timestamp
      })
      return
    }

    res.status(400).json({
      error: `Erro no upload de ficheiro: ${error.message}`,
      timestamp
    })
    return
  }

  // Tratamento de estouro de tempo limite operacional de 1,5s
  if (error.message === 'TIMEOUT_EXCEEDED' || error.name === 'AbortError') {
    res.status(200).json({
      category: 'Não Identificado',
      confidence: 0.0,
      reason: 'Tempo de resposta excedeu o limite restrito de 1,5 segundos.',
      verifiedByAi: false,
      warning: 'Item encaminhado com o aviso interno "não verificado pela IA" para conferência humana.',
      timestamp
    })
    return
  }

  // Erros inesperados de infraestrutura ou modelo
  const statusCode = error.statusCode || error.status || 500
  const message = error.message || 'Ocorreu um erro interno inesperado no processamento do agente de IA.'

  res.status(statusCode).json({
    error: message,
    timestamp,
    ...(isProduction ? {} : { stack: error.stack })
  })
}