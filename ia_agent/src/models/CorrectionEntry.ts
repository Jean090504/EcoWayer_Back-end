export interface CorrectionEntry {
  id: string;
  modelId: string;
  originalPrediction: string;
  correctedLabel: string;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

export const createCorrectionEntry = (input: Partial<CorrectionEntry> = {}): CorrectionEntry => ({
  id: input.id ?? 'correction_001',
  modelId: input.modelId ?? 'model_001',
  originalPrediction: input.originalPrediction ?? 'paper',
  correctedLabel: input.correctedLabel ?? 'plastic',
  reason: input.reason ?? 'Classificação incorreta pela IA.',
  createdAt: input.createdAt ?? new Date(),
  createdBy: input.createdBy ?? 'admin',
});
