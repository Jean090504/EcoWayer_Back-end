
export interface ICorrectionEntryEntity {
  correctionId: string
  targetId: string
  originalPrediction: string
  adminOverride: string
  reviewedByAdminId: string
  appliedToRetrainingBatch: boolean
  createdAt: string
}

export class CorrectionEntry {
  private static correctionsQueue: ICorrectionEntryEntity[] = []

  static save(
    correction: Omit<ICorrectionEntryEntity, 'appliedToRetrainingBatch' | 'createdAt'>
  ): ICorrectionEntryEntity {
    const record: ICorrectionEntryEntity = {
      ...correction,
      appliedToRetrainingBatch: false,
      createdAt: new Date().toISOString()
    }
    this.correctionsQueue.push(record)
    return record
  }

  static countPendingCorrections(): number {
    return this.correctionsQueue.filter(entry => !entry.appliedToRetrainingBatch).length
  }

  static extractPendingBatch(batchSize = 500): ICorrectionEntryEntity[] {
    const pending = this.correctionsQueue
      .filter(entry => !entry.appliedToRetrainingBatch)
      .slice(0, batchSize)

    for (const item of pending) {
      item.appliedToRetrainingBatch = true
    }

    return pending
  }
}