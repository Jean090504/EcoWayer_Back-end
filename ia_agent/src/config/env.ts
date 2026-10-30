import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: toNumber(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME ?? 'ecowayer_ai',
  dbUser: process.env.DB_USER ?? 'postgres',
  dbPassword: process.env.DB_PASSWORD ?? 'postgres',
  visionModelPath: process.env.MODEL_VISION_PATH ?? './src/models_store/vision_v1.onnx',
  textModelPath: process.env.MODEL_TEXT_PATH ?? './src/models_store/text_moderation_v1.onnx',
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 1500),
  jwtSecret: process.env.JWT_SECRET ?? 'local-secret',
  apiKey: process.env.API_KEY ?? 'local-api-key',
};
