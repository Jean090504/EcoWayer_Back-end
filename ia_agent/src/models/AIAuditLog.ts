export interface AIAuditLog {
  id: string;
  entityType: 'listing' | 'chat' | 'moderation';
  entityId: string;
  decision: string;
  confidence: number;
  createdAt: Date;
  reviewer?: string;
}

export const createAIAuditLog = (input: Partial<AIAuditLog> = {}): AIAuditLog => ({
  id: input.id ?? 'audit_001',
  entityType: input.entityType ?? 'listing',
  entityId: input.entityId ?? 'entity_001',
  decision: input.decision ?? 'approved',
  confidence: input.confidence ?? 0.97,
  createdAt: input.createdAt ?? new Date(),
  reviewer: input.reviewer ?? 'system',
});
