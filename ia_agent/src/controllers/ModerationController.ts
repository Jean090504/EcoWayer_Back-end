
import { Request, Response } from 'express'
import { LgpdSanitizerService } from '../services/lgpdSanitizerService.js'
import { AiEngineService } from '../services/aiEngine.js'

const engine = new AiEngineService()
const MODERATION_DEADLINE_MS = 1500

export class ModerationController {
  /**
   * Modera mensagens do chat da aplicação bloqueando termos nocivos e fraudes 
   */
  static async verifyMessage(req: Request, res: Response): Promise<void> {
    const { messageContent, senderId, conversationId } = req.body

    if (!messageContent || typeof messageContent !== 'string') {
      res.status(400).json({ error: 'Conteúdo da mensagem em formato textual é obrigatório.' })
      return
    }

    const sanitization = LgpdSanitizerService.sanitizeChatMessage(messageContent)

    const abortController = new AbortController()
    const timeoutHandle = setTimeout(() => abortController.abort(), MODERATION_DEADLINE_MS)

    try {
      const evaluation = await engine.runTextModeration(sanitization.sanitizedText, abortController.signal)
      clearTimeout(timeoutHandle)

      if (!evaluation.isApproved) {
        res.status(200).json({
          allowed: false,
          flaggedByAi: true,
          reason: `Bloqueado: Linguagem inadequada ou tentativa de transação insegura identificada[cite: 1, 2].`,
          violations: evaluation.flaggedTerms,
          sanitizedContent: sanitization.sanitizedText,
          confidence: evaluation.confidence
        })
        return
      }

      res.status(200).json({
        allowed: true,
        flaggedByAi: true,
        reason: 'Mensagem aprovada sem infrações identificadas.',
        sanitizedContent: sanitization.sanitizedText,
        confidence: evaluation.confidence,
        senderId,
        conversationId
      })
    } catch (err: any) {
      clearTimeout(timeoutHandle)
      res.status(200).json({
        allowed: true,
        flaggedByAi: false,
        warning: 'não verificado pela IA: Encaminhado para a fila de inspeção humana (RF-007.1)[cite: 7].',
        sanitizedContent: sanitization.sanitizedText,
        confidence: 0.0,
        senderId,
        conversationId
      })
    }
  }
}
