
import { Request, Response } from 'express'
import { CorrectionEntry } from '../models/CorrectionEntry.js'
import { AICatalogModel } from '../models/AICatalogModel.js'
import { RetrainingManagerService } from '../services/retrainingManagerService.js'

const retrainingManager = new RetrainingManagerService()
const RETRAIN_BATCH_GOAL = 500

export class AIRetrainingController {
  /**
   * Guarda a correção manual do administrador para integrar o próximo lote de treino 
   */
  static registerCorrection(req: Request, res: Response): void {
    try {
      const { targetId, originalPrediction, adminOverride, adminId } = req.body

      if (!targetId || !adminOverride) {
        res.status(400).json({
          error: 'Identificador do item (targetId) e retificação manual (adminOverride) são obrigatórios.'
        })
        return
      }

      const savedEntry = CorrectionEntry.save({
        targetId,
        originalPrediction: typeof originalPrediction === 'object' ? JSON.stringify(originalPrediction) : String(originalPrediction),
        adminOverride: typeof adminOverride === 'object' ? JSON.stringify(adminOverride) : String(adminOverride),
        reviewedByAdminId: adminId || 'ADMIN_SOBERANO'
      })

      const pendingCount = CorrectionEntry.countPendingCorrections()
      const isBatchReady = pendingCount >= RETRAIN_BATCH_GOAL

      res.status(201).json({
        message: 'Correção registada com sucesso',
        correctionId: savedEntry.correctionId,
        currentPendingCorrections: pendingCount,
        batchGoal: RETRAIN_BATCH_GOAL,
        readyForAutoRetrain: isBatchReady
      })
    } catch (error: any) {
      res.status(500).json({
        error: `Falha ao registar retificação: ${error.message}`
      })
    }
  }

  /**
   * Avalia os testes com dados inéditos de um modelo candidato exigindo pelo menos 85% de acertos 
   */
  static evaluateModelCandidate(req: Request, res: Response): void {
    try {
      const { modelId, validationAccuracy } = req.body

      if (!modelId || typeof validationAccuracy !== 'number') {
        res.status(400).json({
          error: 'É obrigatório indicar o modelId e a taxa numérica de acertos'
        })
        return
      }

      const validation = retrainingManager.validateForRelease(validationAccuracy)

      if (!validation.isEligible) {
        res.status(422).json({
          approved: false,
          reason: validation.justification
        })
        return
      }

      const updatedModel = AICatalogModel.updateLifecycleState(modelId, 'APROVADO')

      res.status(200).json({
        approved: true,
        message: validation.justification,
        model: updatedModel
      })
    } catch (error: any) {
      res.status(500).json({
        error: `Erro durante a homologação do modelo: ${error.message}`
      })
    }
  }

  /**
   * Efetiva a promoção manual do modelo aprovado para o ambiente de produção 
   */
  static authorizeDeploy(req: Request, res: Response): void {
    try {
      const { modelId } = req.body

      const existingModel = AICatalogModel.findById(modelId)
      if (!existingModel) {
        res.status(404).json({ error: `Modelo ${modelId} não encontrado no catálogo central.` })
        return
      }

      if (existingModel.state !== 'APROVADO') {
        res.status(400).json({
          error: 'O modelo precisa estar com o estado APROVADO antes da autorização manual.'
        })
        return
      }

      const deployedModel = AICatalogModel.updateLifecycleState(modelId, 'EM_PRODUCAO')

      res.status(200).json({
        message: 'Autorização concedida. Modelo ativado em produção com sucesso.',
        model: deployedModel
      })
    } catch (error: any) {
      res.status(500).json({
        error: `Erro ao autorizar implementação: ${error.message}`
      })
    }
  }
}