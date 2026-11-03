
import dotenv from 'dotenv'

dotenv.config()

interface AppEnvironment {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PASS: string
  DB_NAME: string
  DB_CONNECTION_LIMIT: number
  AI_SECRET_TOKEN: string
  AI_TIMEOUT_MS: number
  MAX_FILE_SIZE_BYTES: number
}

const getEnvNumber = (key: string, fallback: number): number => {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = parseInt(raw, 10)
  return isNaN(parsed) ? fallback : parsed
}

const requireEnvString = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback
  if (!value) {
    throw new Error(`[Configuração Inválida] Variável de ambiente obrigatória não definida: ${key}`)
  }
  return value
}

export const env: AppEnvironment = {
  NODE_ENV: (process.env.NODE_ENV as AppEnvironment['NODE_ENV']) || 'development',
  PORT: getEnvNumber('PORT', 3333),
  DB_HOST: requireEnvString('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 3306),
  DB_USER: requireEnvString('DB_USER', 'root'),
  DB_PASS: process.env.DB_PASS || '',
  DB_NAME: requireEnvString('DB_NAME', 'ecowayer_db'),
  DB_CONNECTION_LIMIT: getEnvNumber('DB_CONNECTION_LIMIT', 10),
  AI_SECRET_TOKEN: requireEnvString('AI_SECRET_TOKEN', 'ecowayer_secure_token_ai_2026'),
  AI_TIMEOUT_MS: getEnvNumber('AI_TIMEOUT_MS', 1500),
  MAX_FILE_SIZE_BYTES: getEnvNumber('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024)
}