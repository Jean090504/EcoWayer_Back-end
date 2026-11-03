
import express from 'express'
import { env } from './config/env.js'
import { Database } from './config/database.js'
import { apiRoutes } from './routes/apiRoutes.js'
import { adminRoutes } from './routes/adminRoutes.js'
import { errorHandler } from './middlewares/errorHandler.js'

export const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Rotas do ecossistema de IA
app.use('/api/v1/ai', apiRoutes)
app.use('/api/v1/ai/admin', adminRoutes)

// Monitorização de infraestrutura
app.get('/health', async (_, res) => {
  const dbConnected = await Database.ping()
  res.status(dbConnected ? 200 : 503).json({
    service: 'EcoWayer AI Agent',
    database: dbConnected ? 'CONECTADO' : 'DESCONECTADO',
    timestamp: new Date().toISOString()
  })
})

// Tratador global de erros
app.use(errorHandler)

// Inicialização do servidor
const server = app.listen(env.PORT, async () => {
  const dbOk = await Database.ping()
  console.log(`===============================================`)
  console.log(`EcoWayer AI Agent rodando na porta ${env.PORT}`)
  console.log(`Base de Dados MySQL: ${dbOk ? 'ONLINE (Conectado)' : 'OFFLINE (Verifique .env)'}`)
  console.log(`===============================================`)
})

export default server