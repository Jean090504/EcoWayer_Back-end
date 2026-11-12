/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Condição do Item
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerCondicaoItem = require('../controller/condicao_item/condicao_item_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerCondicaoItem.inserirNovaCondicaoItem(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todas (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerCondicaoItem.listarCondicaoItem()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerCondicaoItem.buscarCondicaoItem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerCondicaoItem.atualizarCondicaoItem(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerCondicaoItem.excluirCondicaoItem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router