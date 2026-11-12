/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Pagamento
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerPagamento = require('../controller/pagamento/pagamento_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerPagamento.inserirNovoPagamento(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerPagamento.listarPagamento()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerPagamento.buscarPagamento(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerPagamento.atualizarPagamento(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerPagamento.excluirPagamento(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router