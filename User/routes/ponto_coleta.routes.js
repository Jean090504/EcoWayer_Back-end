/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_ponto_coleta
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerPontoColeta = require('../controller/ponto_coleta/ponto_coleta_controler.js')

const router = express.Router()

// POST /  -> cadastra um ponto de coleta
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerPontoColeta.inserirNovoPontoColeta(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os pontos
router.get('/', async function (request, response) {
    let result = await controllerPontoColeta.listarPontoColeta()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um ponto pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerPontoColeta.buscarPontoColeta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um ponto (recebe o body e o id, nessa ordem da assinatura do controller)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerPontoColeta.atualizarPontoColeta(request.body, request.params.id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um ponto
router.delete('/:id', async function (request, response) {
    let result = await controllerPontoColeta.excluirPontoColeta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router