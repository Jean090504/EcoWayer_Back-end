
import { Request, Response } from 'express'
import { LgpdSanitizerService } from '../services/lgpdSanitizerService.js'
import { PipelineOrchestratorService } from '../services/pipelineOrchestrator.js'
import { AiEngineService } from '../services/aiEngine.js'
import { ImageUploadValidatorModel } from '../models/ImageUploadValidatorModel.js'

const aiEngine = new AiEngineService()
const pipeline = new PipelineOrchestratorService(aiEngine)

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_CLIENT_VERSIONS = ['3.0.0', '2.9.0', '2.8.0']

export class ListingAIController {
  /**
   * Submissão e avaliação de anúncios de reciclagem com imagem e texto 
   */
  static async evaluateListing(req: Request, res: Response): Promise<void> {
    const clientVersion = (req.headers['x-client-version'] as string) || '3.0.0'

    if (!ACCEPTED_CLIENT_VERSIONS.includes(clientVersion)) {
      res.status(400).json({
        error: `Versão do cliente (${clientVersion}) descontinuada. São suportadas até 2 versões anteriores.`
      })
      return
    }

    const { listingId, description } = req.body
    const imageFile = req.file

    // Validação de presença e limite de tamanho do ficheiro
    if (imageFile) {
      if (imageFile.size > MAX_UPLOAD_SIZE) {
        res.status(400).json({
          error: `O ficheiro de imagem excede o teto permitido de 10 MB. Tamanho: ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB.`
        })
        return
      }

      const validation = ImageUploadValidatorModel.validate(imageFile.buffer)
      if (!validation.isValid) {
        res.status(400).json({
          error: validation.errorReason
        })
        return
      }
    }

    // Higienização contra fuga de dados pessoais e eliminação de metadados 
    const textSanitization = LgpdSanitizerService.sanitizeChatMessage(description || '')
    const cleanImageBuffer = imageFile
      ? LgpdSanitizerService.stripGeolocAndExif(imageFile.buffer)
      : undefined

    // Execução com contingência e teto de 1,5s 
    const outcome = await pipeline.processListingItem(
      listingId || `listing_${Date.now()}`,
      textSanitization.sanitizedText,
      cleanImageBuffer
    )

    // Formatação de saída com retrocompatibilidade para o cliente 2.8.0 
    if (clientVersion === '2.8.0') {
      res.status(200).json({
        categoria: outcome.category || 'Indeterminado',
        certeza: outcome.confidence,
        motivo: outcome.reason,
        tempoExecucaoMs: outcome.latencyMs,
        validadoPorIA: outcome.verifiedByAi
      })
      return
    }

    // Resposta padrão (3.0.0 e 2.9.0): categoria encontrada, nível de certeza e motivo da decisão 
    res.status(200).json({
      category: outcome.category || 'Indeterminado',
      confidence: outcome.confidence,
      reason: outcome.reason,
      verifiedByAi: outcome.verifiedByAi,
      latencyMs: outcome.latencyMs,
      modelVersion: outcome.modelVersion
    })
  }
}