/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de acesso
 * Local: routes/acesso.routes.js
 *
 * Registro no app:
 *   const acessoRouter = require('./routes/acesso.routes.js') //Rotas responsaveis pelos acessos dos usuarios
 *   app.use('/meraki/ecowayer/admin/acesso', cors(corsOptions), acessoRouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAcesso = require('../controller/acesso/acesso_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerAcesso.inserirNovoAcesso(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerAcesso.listarAcesso()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerAcesso.buscarAcesso(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerAcesso.atualizarAcesso(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerAcesso.excluirAcesso(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router