/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_pontos
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerPontos = require('../controller/pontos/pontos_controler.js')
const { exigirProprietario, listarSomenteProprietario } = require('../middleware/proprietario.js')

const router = express.Router()

// POST /  -> registra pontos para um usuário
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerPontos.inserirNovoPontos(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os registros de pontos
router.get('/', listarSomenteProprietario(controllerPontos.listarPontos, 'pontos'))

// GET /:id  -> busca um registro de pontos pelo id
router.get('/:id', exigirProprietario(controllerPontos.buscarPontos, 'pontos'), async function (request, response) {
    let result = await controllerPontos.buscarPontos(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um registro (id na URL, body no segundo argumento)
router.put('/:id', exigirProprietario(controllerPontos.buscarPontos, 'pontos'), bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerPontos.atualizarPontos(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> bloqueado de propósito: pontos são histórico contábil
router.delete('/:id', exigirProprietario(controllerPontos.buscarPontos, 'pontos'), async function (request, response) {
    let message = JSON.parse(JSON.stringify(require('../controller/modulo/configMessages.js')))

    message.DEFAULT_MESSAGE.status = false
    message.DEFAULT_MESSAGE.status_code = 405
    message.DEFAULT_MESSAGE.message = 'OPERAÇÃO NÃO PERMITIDA: registros de pontos não podem ser excluídos (histórico contábil)'

    response.status(405)
    response.json(message.DEFAULT_MESSAGE)
})

module.exports = router
