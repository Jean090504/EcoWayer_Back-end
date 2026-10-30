
export interface IAIAuditLogEntity {
  auditId: string
  targetId: string
  targetType: 'CHAT_MESSAGE' | 'ITEM_LISTING'
  modelVersion: string
  verifiedByAi: boolean
  confidenceScore: number
  decisionOutcome: 'APROVADO' | 'REPROVADO' | 'CONTINGENCIA_HUMANA'
  justificationReason: string
  latencyMs: number
  timestamp: string
}

export class AIAuditLog {
  private static auditEntries: IAIAuditLogEntity[] = []

  static record(entry: IAIAuditLogEntity): void {
    this.auditEntries.push(Object.freeze({ ...entry }))
  }

  static getRecentLogs(limit = 100): IAIAuditLogEntity[] {
    return this.auditEntries.slice(-limit)
  }

  static countDecisionsInLast24Hours(): { total: number; rejectedByAdmin: number } {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const relevant = this.auditEntries.filter(log => new Date(log.timestamp).getTime() >= oneDayAgo)
    const overrides = relevant.filter(log => log.decisionOutcome === 'CONTINGENCIA_HUMANA')

    return {
      total: relevant.length,
      rejectedByAdmin: overrides.length
    }
  }
}