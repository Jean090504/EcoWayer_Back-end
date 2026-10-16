/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de anúncio
 * Local: routes/anuncio.routes.js
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAnuncio = require('../controller/anuncio/anuncio_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerAnuncio.inserirNovoAnuncio(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerAnuncio.listarAnuncio()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerAnuncio.buscarAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerAnuncio.atualizarAnuncio(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerAnuncio.excluirAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router