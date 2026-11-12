/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_qr_code
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerQrCode = require('../controller/qr_code/qr_code_controler.js')

const router = express.Router()

// POST /  -> cria um QR Code
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerQrCode.inserirNovoQrCode(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os QR Codes
router.get('/', async function (request, response) {
    let result = await controllerQrCode.listarQrCodes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um QR Code pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerQrCode.buscarQrCode(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um QR Code
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerQrCode.atualizarQrCode(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um QR Code
router.delete('/:id', async function (request, response) {
    let result = await controllerQrCode.excluirQrCode(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router