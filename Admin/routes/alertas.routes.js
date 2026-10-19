/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de alertas
 * Local: routes/alertas.routes.js
 *
 * Registro no app:
 *   const alertasRouter = require('./routes/alertas.routes.js') //Rotas responsaveis pelos alertas
 *   app.use('/meraki/ecowayer/admin/alertas', cors(corsOptions), alertasRouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAlertas = require('../controller/alertas/alertas_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerAlertas.inserirNovoAlerta(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerAlertas.listarAlertas()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerAlertas.buscarAlerta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerAlertas.atualizarAlerta(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerAlertas.excluirAlerta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router