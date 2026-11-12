
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { AIAuditController } from '../controllers/AIAuditController.js'
import { AIRetrainingController } from '../controllers/AIRetrainingController.js'

export const adminRoutes = Router()

// Todas as rotas administrativas exigem credenciais válidas 
adminRoutes.use(authMiddleware)

// Listagem de registos de auditoria e justificativas de bloqueio
adminRoutes.get('/audit/logs', AIAuditController.listLogs)

// Métricas de estabilidade das últimas 24h e alerta de rollback
adminRoutes.get('/audit/metrics', AIAuditController.getHealthMetrics)

// Registo de correções manuais do administrador (referência de lote de 500 itens)
adminRoutes.post('/retraining/corrections', AIRetrainingController.registerCorrection)

// Homologação técnica do modelo com prova cega (mínimo de 85% de acertos)[cite: 3]
adminRoutes.post('/retraining/evaluate-candidate', AIRetrainingController.evaluateModelCandidate)

// Autorização manual e expressa do Administrador para deploy em produção
adminRoutes.post('/retraining/authorize-deploy', AIRetrainingController.authorizeDeploy)