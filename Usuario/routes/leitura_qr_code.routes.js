/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_leitura_qr_code
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerLeituraQrCode = require('../controller/leitura_qr_code/leitura_qr_code_controler.js')

const router = express.Router()

// POST /  -> registra uma leitura de QR Code
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerLeituraQrCode.inserirNovaLeituraQrCode(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todas as leituras
router.get('/', async function (request, response) {
    let result = await controllerLeituraQrCode.listarLeiturasQrCode()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma leitura pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerLeituraQrCode.buscarLeituraQrCode(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma leitura
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerLeituraQrCode.atualizarLeituraQrCode(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma leitura
router.delete('/:id', async function (request, response) {
    let result = await controllerLeituraQrCode.excluirLeituraQrCode(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router