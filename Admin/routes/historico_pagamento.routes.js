/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Histórico de Pagamento
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerHistoricoPagamento = require('../controller/historico_pagamento/historico_pagamento_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerHistoricoPagamento.inserirNovoHistoricoPagamento(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerHistoricoPagamento.listarHistoricoPagamento()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerHistoricoPagamento.buscarHistoricoPagamento(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerHistoricoPagamento.atualizarHistoricoPagamento(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerHistoricoPagamento.excluirHistoricoPagamento(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router