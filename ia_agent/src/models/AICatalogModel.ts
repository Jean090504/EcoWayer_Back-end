export interface AICatalogModel {
  id: string;
  name: string;
  version: string;
  type: 'vision' | 'text' | 'moderation';
  path: string;
  status: 'active' | 'idle' | 'deprecated';
  createdAt: Date;
}

export const createAICatalogModel = (input: Partial<AICatalogModel> = {}): AICatalogModel => ({
  id: input.id ?? 'model_001',
  name: input.name ?? 'vision_model',
  version: input.version ?? 'v1',
  type: input.type ?? 'vision',
  path: input.path ?? './src/models_store/vision_v1.onnx',
  status: input.status ?? 'active',
  createdAt: input.createdAt ?? new Date(),
});
