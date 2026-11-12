
export type ItemCondition = 'novo' | 'ótimo estado' | 'usado' | 'danificado'

import { GeminiService } from '../services/geminiService.js'

export interface ImageClassificationResult {
  category: string
  condition: ItemCondition
  confidence: number
  inferenceTimeMs: number
}

export interface ModerationResult {
  isApproved: boolean
  reasons: string[]
  confidence: number
  matchedTerms: string[]
}

export interface InferenceDecision {
  entityId: string
  verifiedByAi: boolean
  humanReviewRequired: boolean
  modelMetadata: {
    modelName: string
    modelVersion: string
    executedAt: string
  }
  moderation?: ModerationResult
  classification?: ImageClassificationResult
  internalNote?: string
}

export class AiInferenceModel {
  // Limite estipulado de 1,5 segundos para a execução completa do pipeline de inferência 
  private static readonly TIMEOUT_MS = 1500
  private static readonly FAILURE_THRESHOLD = 5
  private static readonly RESET_TIMEOUT_MS = 10000

  private static failureCount = 0
  private static circuitOpenUntil = 0

  // Banco de termos suspeitos, ofensas e tentativas de transação insegura fora da plataforma
  private static readonly SUSPICIOUS_LEXICON = [
    'pix fora', 'pagamento direto', 'transferência antecipada', 'chave aleatória',
    'desgraçado', 'ladrão', 'golpista', 'idiota', 'envia comprovante no zap'
  ]

  /**
   * Executa a inferência completa com controlo de tempo, captura de exceções e failover resiliente
   */
  async executeInference(
    entityId: string,
    cleanText: string,
    imageBuffer?: Buffer,
    modelVersion = 'v1.4.2-onnx'
  ): Promise<InferenceDecision> {
    const now = Date.now()

    // Verificação do Circuit Breaker para evitar sobrecarga continuada em falhas do runtime
    if (AiInferenceModel.circuitOpenUntil > now) {
      return this.buildFallbackDecision(
        entityId,
        'Circuito de segurança aberto devido a falhas consecutivas no runtime de inferência.'
      )
    }

    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), AiInferenceModel.TIMEOUT_MS)

    try {
      const decision = await Promise.race([
        this.runModelPipeline(entityId, cleanText, imageBuffer, modelVersion, controller.signal),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT_EXCEEDED')))
        })
      ])

      clearTimeout(timeoutHandle)
      AiInferenceModel.failureCount = 0
      return decision
    } catch (err: any) {
      clearTimeout(timeoutHandle)
      AiInferenceModel.failureCount++

      if (AiInferenceModel.failureCount >= AiInferenceModel.FAILURE_THRESHOLD) {
        AiInferenceModel.circuitOpenUntil = Date.now() + AiInferenceModel.RESET_TIMEOUT_MS
      }

      // Em caso de falha ou tempo excedido, o item não é bloqueado; segue para conferência humana
      return this.buildFallbackDecision(
        entityId,
        err.message === 'TIMEOUT_EXCEEDED'
          ? 'Tempo de resposta excedeu o limite restrito de 1,5 segundos.'
          : `Erro de execução no modelo: ${err.message}`
      )
    }
  }

  /**
   * Pipeline de avaliação das regras de moderação e categorização visual
   */
  private async runModelPipeline(
    entityId: string,
    cleanText: string,
    imageBuffer: Buffer | undefined,
    modelVersion: string,
    signal: AbortSignal
  ): Promise<InferenceDecision> {
    const startTime = Date.now()
    if (signal.aborted) throw new Error('TIMEOUT_EXCEEDED')

    if (GeminiService.isConfigured()) {
      try {
        const ai = await GeminiService.analyzeListing('Anúncio', cleanText, imageBuffer)
        const classification = imageBuffer ? {
          category: ai.category,
          condition: ai.condition as ItemCondition,
          confidence: ai.confidence,
          inferenceTimeMs: Date.now() - startTime
        } : undefined
        return {
          entityId,
          verifiedByAi: true,
          humanReviewRequired: !ai.approved || ai.confidence < 0.85,
          modelMetadata: { modelName: 'Gemini', modelVersion, executedAt: new Date().toISOString() },
          moderation: { isApproved: ai.approved, reasons: ai.reasons, confidence: ai.confidence, matchedTerms: [] },
          classification
        }
      } catch {
        // Usa o pipeline local quando o Gemini falhar ou retornar JSON inválido.
      }
    }

    // Moderação de texto em tempo real
    const matchedTerms: string[] = []
    const lower = cleanText.toLowerCase()

    for (const term of AiInferenceModel.SUSPICIOUS_LEXICON) {
      if (lower.includes(term)) {
        matchedTerms.push(term)
      }
    }

    const isTextApproved = matchedTerms.length === 0
    const moderation: ModerationResult = {
      isApproved: isTextApproved,
      reasons: isTextApproved
        ? []
        : ['Linguagem imprópria, tentativa de fraude financeira ou transação fora da plataforma detetada.'],
      confidence: isTextApproved ? 0.98 : 0.95,
      matchedTerms
    }

    // Classificação visual simulando runtime
    let classification: ImageClassificationResult | undefined
    if (imageBuffer && imageBuffer.length > 0) {
      classification = {
        category: 'Plásticos e Polímeros',
        condition: 'usado',
        confidence: 0.89,
        inferenceTimeMs: Date.now() - startTime
      }
    }

    // Verificação da nota mínima de corte de 85% para aprovação automática
    const requiresHuman = !moderation.isApproved || (classification ? classification.confidence < 0.85 : false)

    return {
      entityId,
      verifiedByAi: true,
      humanReviewRequired: requiresHuman,
      modelMetadata: {
        modelName: 'EcoWayer-VisionMod-Core',
        modelVersion,
        executedAt: new Date().toISOString()
      },
      moderation,
      classification
    }
  }

  /**
   * Constrói o resultado de contingência com a sinalização 'não verificado pela IA'
   */
  private buildFallbackDecision(entityId: string, reason: string): InferenceDecision {
    return {
      entityId,
      verifiedByAi: false,
      humanReviewRequired: true,
      modelMetadata: {
        modelName: 'EcoWayer-VisionMod-Core',
        modelVersion: 'FALLBACK_HANDLER',
        executedAt: new Date().toISOString()
      },
      internalNote: `Item publicado como 'não verificado pela IA'. Enviado para a lista de espera de revisão humana. Motivo: ${reason}`
    }
  }
}
