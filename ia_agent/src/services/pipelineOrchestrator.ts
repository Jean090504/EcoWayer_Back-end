
import { AiEngineService } from './aiEngine.js'
import { AIAuditLog } from '../models/AIAuditLog.js'

export interface IOrchestrationResult {
  targetId: string
  verifiedByAi: boolean
  requiresHumanReview: boolean
  statusLabel: 'APROVADO' | 'REPROVADO' | 'CONTINGENCIA_HUMANA'
  category?: string
  confidence: number
  reason: string
  latencyMs: number
  modelVersion: string
}

export class PipelineOrchestratorService {
  private static readonly TIMEOUT_MS = 1500 // Teto obrigatório de 1,5s
  private static consecutiveErrors = 0
  private static circuitBreakerOpenUntil = 0
  private static readonly ERROR_THRESHOLD = 5
  private static readonly COOLDOWN_PERIOD_MS = 10000

  private aiEngine: AiEngineService

  constructor(aiEngine: AiEngineService) {
    this.aiEngine = aiEngine
  }

  async processListingItem(
    listingId: string,
    sanitizedDescription: string,
    imageBuffer?: Buffer,
    modelVersion = 'v1.4.2-onnx'
  ): Promise<IOrchestrationResult> {
    const startTime = Date.now()
    const now = Date.now()

    if (PipelineOrchestratorService.circuitBreakerOpenUntil > now) {
      return this.fallbackToHumanReview(
        listingId,
        'Circuito de proteção aberto devido a instabilidade no motor de inferência.',
        startTime,
        modelVersion
      )
    }

    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), PipelineOrchestratorService.TIMEOUT_MS)

    try {
      const outcome = await Promise.race([
        this.runInferenceSequence(listingId, sanitizedDescription, imageBuffer, modelVersion, abortController.signal, startTime),
        new Promise<never>((_, reject) => {
          abortController.signal.addEventListener('abort', () => reject(new Error('TIMEOUT_EXCEEDED')))
        })
      ])

      clearTimeout(timer)
      PipelineOrchestratorService.consecutiveErrors = 0
      return outcome
    } catch (err: any) {
      clearTimeout(timer)
      PipelineOrchestratorService.consecutiveErrors++

      if (PipelineOrchestratorService.consecutiveErrors >= PipelineOrchestratorService.ERROR_THRESHOLD) {
        PipelineOrchestratorService.circuitBreakerOpenUntil = Date.now() + PipelineOrchestratorService.COOLDOWN_PERIOD_MS
      }

      const reasonMsg = err.message === 'TIMEOUT_EXCEEDED'
        ? 'Tempo limite de 1,5s ultrapassado (RNF-002.2).'
        : `Erro operacional no pipeline: ${err.message}`

      return this.fallbackToHumanReview(listingId, reasonMsg, startTime, modelVersion)
    }
  }

  private async runInferenceSequence(
    listingId: string,
    description: string,
    imageBuffer: Buffer | undefined,
    modelVersion: string,
    signal: AbortSignal,
    startTime: number
  ): Promise<IOrchestrationResult> {
    const textEval = await this.aiEngine.runTextModeration(description, signal)
    if (!textEval.isApproved) {
      const elapsed = Date.now() - startTime
      const rejectionResult: IOrchestrationResult = {
        targetId: listingId,
        verifiedByAi: true,
        requiresHumanReview: true,
        statusLabel: 'REPROVADO',
        confidence: textEval.confidence,
        reason: `Reprovado: Termos proibidos detectados (${textEval.flaggedTerms.join(', ')})`,
        latencyMs: elapsed,
        modelVersion
      }
      this.auditDecision(rejectionResult)
      return rejectionResult
    }

    let detectedCategory = 'Reciclável Geral'
    let confidence = textEval.confidence

    if (imageBuffer && imageBuffer.length > 0) {
      const visionEval = await this.aiEngine.runImageClassification(imageBuffer, signal)
      detectedCategory = `${visionEval.category} (${visionEval.condition})`
      confidence = visionEval.confidence
    }

    const elapsed = Date.now() - startTime
    const belowThreshold = confidence < 0.85

    const result: IOrchestrationResult = {
      targetId: listingId,
      verifiedByAi: true,
      requiresHumanReview: belowThreshold,
      statusLabel: belowThreshold ? 'CONTINGENCIA_HUMANA' : 'APROVADO',
      category: detectedCategory,
      confidence,
      reason: belowThreshold
        ? 'Nível de certeza inferior a 85% (RF-003.2). Encaminhado para validação humana.'
        : 'Análise de material e moderação concluídas com sucesso.',
      latencyMs: elapsed,
      modelVersion
    }

    this.auditDecision(result)
    return result
  }

  private fallbackToHumanReview(
    listingId: string,
    justification: string,
    startTime: number,
    modelVersion: string
  ): IOrchestrationResult {
    const elapsed = Date.now() - startTime
    const contingencyResult: IOrchestrationResult = {
      targetId: listingId,
      verifiedByAi: false,
      requiresHumanReview: true,
      statusLabel: 'CONTINGENCIA_HUMANA',
      confidence: 0.0,
      reason: `não verificado pela IA: ${justification} (RF-007.1)`,
      latencyMs: elapsed,
      modelVersion
    }

    this.auditDecision(contingencyResult)
    return contingencyResult
  }

  private auditDecision(decision: IOrchestrationResult): void {
    AIAuditLog.record({
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      targetId: decision.targetId,
      targetType: 'ITEM_LISTING',
      modelVersion: decision.modelVersion,
      verifiedByAi: decision.verifiedByAi,
      confidenceScore: decision.confidence,
      decisionOutcome: decision.statusLabel,
      justificationReason: decision.reason,
      latencyMs: decision.latencyMs,
      timestamp: new Date().toISOString()
    })
  }
}