import { env } from '../config/env.js';

export interface PipelineRequest {
  content: string;
  type: 'listing' | 'chat';
}

export class PipelineOrchestrator {
  public async process({ content, type }: PipelineRequest): Promise<{ type: string; status: string; timeout: number }> {
    const timeout = env.requestTimeoutMs;

    return {
      type,
      status: content ? 'processed' : 'fallback',
      timeout,
    };
  }
}
