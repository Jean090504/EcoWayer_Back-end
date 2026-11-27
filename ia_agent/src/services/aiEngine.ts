

import { ItemCondition } from '../models/AiInferenceModel.js'
import { GeminiService } from './geminiService.js'

export type RecyclableCategory = string

export interface IVisualEvaluation {
  category: RecyclableCategory
  condition: ItemCondition
  confidence: number
}

export interface IModerationEvaluation {
  isApproved: boolean
  flaggedTerms: string[]
  confidence: number
}

export class AiEngineService {
  // Lista atualizada de frases suspeitas, tentativas de golpes financeiros e pedidos indevidos de dados
  private static readonly SUSPICIOUS_LEXICON = [
    'pix fora da plataforma', 'pagamento por fora', 'envia o comprovante no zap',
    'depósito antecipado', 'chave aleatória no email', 'fraude', 'golpe',
    'idiota', 'desgraçado', 'ladrão', 'maldito'
  ]

  /**
   * Analisa a foto do anúncio para classificar material reciclável e estado do objeto 
   */
  async runImageClassification(imageBuffer: Buffer, signal: AbortSignal): Promise<IVisualEvaluation> {
    if (signal.aborted) {
      throw new Error('TIMEOUT_EXCEEDED')
    }

    const result = await GeminiService.analyzeListing('Anúncio', '', imageBuffer, signal)
    if (!result.approved) throw new Error(result.reasons.join('; ') || 'Imagem precisa de revisão humana')
    return {
      category: result.category,
      condition: result.condition as ItemCondition,
      confidence: result.confidence
    }
  }

  /**
   * Modera mensagens de chat em português em tempo real contra abusos e fraudes
   */
  async runTextModeration(textContent: string, signal: AbortSignal): Promise<IModerationEvaluation> {
    if (signal.aborted) {
      throw new Error('TIMEOUT_EXCEEDED')
    }

    const lower = textContent.toLowerCase()
    const violations: string[] = []

    for (const term of AiEngineService.SUSPICIOUS_LEXICON) {
      if (lower.includes(term)) {
        violations.push(term)
      }
    }

    const approved = violations.length === 0

    return {
      isApproved: approved,
      flaggedTerms: violations,
      confidence: approved ? 0.98 : 0.96
    }
  }
}
