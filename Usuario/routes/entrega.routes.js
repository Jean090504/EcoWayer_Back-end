/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_entrega
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerEntrega = require('../controller/entrega/entrega_controler.js')

const router = express.Router()

// POST /  -> cria uma entrega
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEntrega.inserirNovaEntrega(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todas as entregas
router.get('/', async function (request, response) {
    let result = await controllerEntrega.listarEntregas()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma entrega pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerEntrega.buscarEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma entrega
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEntrega.atualizarEntrega(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma entrega
router.delete('/:id', async function (request, response) {
    let result = await controllerEntrega.excluirEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router