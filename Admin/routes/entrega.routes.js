/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de entrega
 * Local: routes/entrega.routes.js
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerEntrega = require('../controller/entrega/entrega_controler.js')

router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerEntrega.inserirNovaEntrega(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

router.get('/', async function (request, response) {
    let result = await controlerEntrega.listarEntregas()

    response.status(result.status_code)
    response.json(result)
})

router.get('/:id', async function (request, response) {
    let result = await controlerEntrega.buscarEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerEntrega.atualizarEntrega(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

router.delete('/:id', async function (request, response) {
    let result = await controlerEntrega.excluirEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router