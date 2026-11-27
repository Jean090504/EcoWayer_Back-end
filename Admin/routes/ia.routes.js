/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de IA
 * Local: routes/ia.routes.js
 *
 * Registro no app:
 *   const iaRouter = require('./routes/ia.routes.js') //Rotas responsaveis pela IA
 *   app.use('/meraki/ecowayer/admin/ia', cors(corsOptions), iaRouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerIA = require('../controller/ia/ia_controler.js')

// O painel usa esta rota para conversar com a Eco. A credencial do agente
// permanece no backend; a autenticação administrativa é aplicada em app.js.
router.post('/assistant-chat', bodyParserJSON, async function (request, response) {
    const message = request.body?.message
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
        return response.status(400).json({ message: 'Informe uma mensagem de até 2000 caracteres.' })
    }

    const aiToken = process.env.AI_SECRET_TOKEN
    if (!aiToken) return response.status(503).json({ message: 'Assistente de IA não configurado no servidor.' })

    const aiUrl = String(process.env.AI_AGENT_URL || 'http://localhost:3333/api/v1/ai').replace(/\/+$/, '')
    const history = Array.isArray(request.body.history) ? request.body.history.slice(-10) : []
    try {
        const db = require('../model/DAO/pontos/pontos.js').dbContexto
        const { obterContextoPainel } = require('../services/contextoAssistente.js')
        const { buscarDashboardPontos } = require('../controller/pontos/pontos_controler.js')
        const context = await obterContextoPainel({ db, buscarDashboard: buscarDashboardPontos })
        const aiResponse = await fetch(`${aiUrl}/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-ai-token': aiToken },
            body: JSON.stringify({ message: message.trim(), history, context, audience: 'admin' }),
            signal: AbortSignal.timeout(20000)
        })
        const data = await aiResponse.json().catch(() => ({}))
        return response.status(aiResponse.status).json(data)
    } catch {
        return response.status(502).json({ message: 'Assistente de IA indisponível.' })
    }
})

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerIA.inserirNovaIA(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerIA.listarIA()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerIA.buscarIA(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerIA.atualizarIA(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerIA.excluirIA(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
