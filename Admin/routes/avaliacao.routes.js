/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Avaliação
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAvaliacao = require('../controller/avaliacao/avaliacao_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerAvaliacao.inserirNovaAvaliacao(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todas (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerAvaliacao.listarAvaliacao()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerAvaliacao.buscarAvaliacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerAvaliacao.atualizarAvaliacao(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerAvaliacao.excluirAvaliacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router