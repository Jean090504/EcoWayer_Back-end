/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_avaliacao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerAvaliacao = require('../controller/avaliacao/avaliacao_controler.js')

const router = express.Router()

// POST /  -> registra a avaliação de uma entrega
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerAvaliacao.inserirNovaAvaliacao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as avaliações
router.get('/', async function (request, response) {
    let result = await controllerAvaliacao.listarAvaliacoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma avaliação pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerAvaliacao.buscarAvaliacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> corrige uma avaliação (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerAvaliacao.atualizarAvaliacao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> bloqueado de propósito: avaliação é reputação do usuário
router.delete('/:id', async function (request, response) {
    let message = JSON.parse(JSON.stringify(require('../controller/modulo/configMessages.js')))

    message.DEFAULT_MESSAGE.status = false
    message.DEFAULT_MESSAGE.status_code = 405
    message.DEFAULT_MESSAGE.message = 'OPERAÇÃO NÃO PERMITIDA: avaliações não podem ser excluídas (reputação do usuário)'

    response.status(405)
    response.json(message.DEFAULT_MESSAGE)
})

module.exports = router