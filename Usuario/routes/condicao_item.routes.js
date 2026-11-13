/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_condicao_item
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerCondicaoItem = require('../controller/condicao_item/condicao_item_controler.js')

const router = express.Router()

// POST /  -> cria uma condição
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerCondicaoItem.inserirNovaCondicaoItem(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as condições
router.get('/', async function (request, response) {
    let result = await controllerCondicaoItem.listarCondicoesItem()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma condição pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerCondicaoItem.buscarCondicaoItem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma condição (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerCondicaoItem.atualizarCondicaoItem(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma condição (bloqueada se houver anúncio ou multiplicador usando)
router.delete('/:id', async function (request, response) {
    let result = await controllerCondicaoItem.excluirCondicaoItem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router