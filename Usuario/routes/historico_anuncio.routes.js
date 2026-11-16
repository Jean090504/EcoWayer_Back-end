/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_historico_anuncio
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerHistoricoAnuncio = require('../controller/historico_anuncio/historico_anuncio_controler.js')

const router = express.Router()

// POST /  -> registra uma alteração no histórico do anúncio
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerHistoricoAnuncio.inserirNovoHistoricoAnuncio(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista o histórico
router.get('/', async function (request, response) {
    let result = await controllerHistoricoAnuncio.listarHistoricoAnuncio()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um registro pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerHistoricoAnuncio.buscarHistoricoAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> corrige um registro (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerHistoricoAnuncio.atualizarHistoricoAnuncio(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> bloqueado de propósito: histórico é auditoria
router.delete('/:id', async function (request, response) {
    let message = JSON.parse(JSON.stringify(require('../controller/modulo/configMessages.js')))

    message.DEFAULT_MESSAGE.status = false
    message.DEFAULT_MESSAGE.status_code = 405
    message.DEFAULT_MESSAGE.message = 'OPERAÇÃO NÃO PERMITIDA: o histórico do anúncio não pode ser excluído (auditoria)'

    response.status(405)
    response.json(message.DEFAULT_MESSAGE)
})

module.exports = router