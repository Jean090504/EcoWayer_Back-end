export interface InferenceResult {
  label: string;
  confidence: number;
  model: string;
}

export class AiEngine {
  public async infer(input: string): Promise<InferenceResult> {
    return {
      label: input.includes('ofensa') ? 'flagged' : 'approved',
      confidence: 0.94,
      model: 'local-default',
    };
  }
}
