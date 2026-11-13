/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_voucher_catalogo
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerVoucherCatalogo = require('../controller/voucher_catalogo/voucher_catalogo_controler.js')

const router = express.Router()

// POST /  -> cria um item do catálogo
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucherCatalogo.inserirNovoVoucherCatalogo(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista o catálogo
router.get('/', async function (request, response) {
    let result = await controllerVoucherCatalogo.listarVoucherCatalogo()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um item pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerVoucherCatalogo.buscarVoucherCatalogo(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um item (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucherCatalogo.atualizarVoucherCatalogo(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um item (bloqueado se houver voucher usando o item)
router.delete('/:id', async function (request, response) {
    let result = await controllerVoucherCatalogo.excluirVoucherCatalogo(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router