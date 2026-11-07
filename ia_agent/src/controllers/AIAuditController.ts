
import { Request, Response } from 'express'
import { AIAuditLog } from '../models/AIAuditLog.js'
import { RetrainingManagerService } from '../services/retrainingManagerService.js'

const retrainingService = new RetrainingManagerService()

export class AIAuditController {
  /**
   * Consulta os registos de auditoria recentes para visualização no painel administrativo 
   */
  static async listLogs(req: Request, res: Response): Promise<void> {
    try {
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      const safeLimit = Math.min(Math.max(limitParam, 1), 200)

      const logs = await AIAuditLog.getRecentLogs(safeLimit)

      res.status(200).json({
        totalRetrieved: logs.length,
        logs
      })
    } catch (error: any) {
      res.status(500).json({
        error: `Erro ao obter registos de auditoria: ${error.message}`
      })
    }
  }

  /**
   * Avalia a integridade do modelo em produção nas últimas 24 horas e sinaliza necessidade de reversão 
   */
  static async getHealthMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const stats24h = await AIAuditLog.countDecisionsInLast24Hours()
      const rollbackStatus = retrainingService.verifyRollbackEmergency(
        stats24h.total,
        stats24h.rejectedByAdmin
      )

      const overrideRatio = stats24h.total > 0
        ? (stats24h.rejectedByAdmin / stats24h.total) * 100
        : 0

      res.status(200).json({
        period: '24h',
        totalDecisions: stats24h.total,
        contingencyOrOverriddenCount: stats24h.rejectedByAdmin,
        overridePercentage: `${overrideRatio.toFixed(2)}%`,
        rollbackAlertActive: rollbackStatus.triggerRollback,
        warningThreshold: '15.00%'
      })
    } catch (error: any) {
      res.status(500).json({
        error: `Erro ao calcular métricas de integridade: ${error.message}`
      })
    }
  }
}
