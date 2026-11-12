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