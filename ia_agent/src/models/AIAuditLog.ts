
export type TargetEntityType = 'CHAT_MESSAGE' | 'ITEM_LISTING'
export type DecisionStatus = 'APROVADO' | 'REPROVADO' | 'CONTINGENCIA_HUMANA'

export interface IAIAuditLogEntity {
  auditId: string
  targetId: string
  targetType: TargetEntityType
  modelVersion: string
  verifiedByAi: boolean
  confidenceScore: number
  decisionOutcome: DecisionStatus
  justificationReason: string
  latencyMs: number
  timestamp: string
}

export class AIAuditLog {
  private static auditLedger: IAIAuditLogEntity[] = []

  static record(entry: IAIAuditLogEntity): void {
    // Congela a entidade para impedir mutações posteriores nos registos de prova
    this.auditLedger.push(Object.freeze({ ...entry }))
  }

  static getRecentLogs(limit = 100): IAIAuditLogEntity[] {
    return this.auditLedger.slice(-limit)
  }

  static findByTargetId(targetId: string): IAIAuditLogEntity[] {
    return this.auditLedger.filter(log => log.targetId === targetId)
  }

  /**
   * Monitorização contínua das últimas 24 horas para deteção de desvios e rollback
   */
  static countDecisionsInLast24Hours(): { total: number; rejectedByAdmin: number } {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const logsLastDay = this.auditLedger.filter(
      log => new Date(log.timestamp).getTime() >= oneDayAgo
    )
    const contingencies = logsLastDay.filter(
      log => log.decisionOutcome === 'CONTINGENCIA_HUMANA'
    )

    return {
      total: logsLastDay.length,
      rejectedByAdmin: contingencies.length
    }
  }
}