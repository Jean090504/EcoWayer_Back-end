/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de treinamento de IA
 * Local: routes/treinamento_ia.routes.js
 *
 * Registro no app:
 *   const treinamentoIARouter = require('./routes/treinamento_ia.routes.js') //Rotas responsaveis pelo treinamento de IA
 *   app.use('/meraki/ecowayer/admin/treinamento-ia', cors(corsOptions), treinamentoIARouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerTreinamentoIA = require('../controller/treinamento_ia/treinamento_ia_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerTreinamentoIA.inserirNovoTreinamentoIA(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerTreinamentoIA.listarTreinamentoIA()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerTreinamentoIA.buscarTreinamentoIA(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerTreinamentoIA.atualizarTreinamentoIA(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerTreinamentoIA.excluirTreinamentoIA(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router