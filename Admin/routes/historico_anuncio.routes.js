/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de histórico do anúncio
 * Local: routes/historico_anuncio.routes.js
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerHistoricoAnuncio = require('../controller/historico_anuncio/historico_anuncio_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerHistoricoAnuncio.inserirNovoHistoricoAnuncio(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerHistoricoAnuncio.listarHistoricoAnuncio()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerHistoricoAnuncio.buscarHistoricoAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerHistoricoAnuncio.atualizarHistoricoAnuncio(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerHistoricoAnuncio.excluirHistoricoAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router