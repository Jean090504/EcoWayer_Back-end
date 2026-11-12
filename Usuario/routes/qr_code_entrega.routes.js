/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_qr_code_entrega
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerQrCodeEntrega = require('../controller/qr_code_entrega/qr_code_entrega_controler.js')

const router = express.Router()

// POST /  -> cria um vínculo QR Code x anúncio x entrega
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerQrCodeEntrega.inserirNovoQrCodeEntrega(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os vínculos
router.get('/', async function (request, response) {
    let result = await controllerQrCodeEntrega.listarQrCodeEntregas()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um vínculo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerQrCodeEntrega.buscarQrCodeEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um vínculo
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerQrCodeEntrega.atualizarQrCodeEntrega(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um vínculo
router.delete('/:id', async function (request, response) {
    let result = await controllerQrCodeEntrega.excluirQrCodeEntrega(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router