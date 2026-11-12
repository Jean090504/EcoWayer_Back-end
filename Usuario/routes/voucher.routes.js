/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_voucher
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerVoucher = require('../controller/voucher/voucher_controler.js')

const router = express.Router()

// POST /  -> cria um voucher
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucher.inserirNovoVoucher(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os vouchers
router.get('/', async function (request, response) {
    let result = await controllerVoucher.listarVouchers()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um voucher pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerVoucher.buscarVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um voucher (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucher.atualizarVoucher(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um voucher (bloqueado se houver QR Code vinculado)
router.delete('/:id', async function (request, response) {
    let result = await controllerVoucher.excluirVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router