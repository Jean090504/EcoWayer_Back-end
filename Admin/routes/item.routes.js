/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas do CRUD de item
 *            (o verbo HTTP define a ação: POST insere, PUT atualiza, GET lista/busca, DELETE exclui)
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const express = require('express')
const router = express.Router()

// CONFIRME o caminho do controller no seu projeto
const controllerItem = require('../controller/item/item_controler.js')

// POST /  -> insere um item
router.post('/', async function (request, response) {
    let contentType = request.headers['content-type']
    let dados = request.body

    let result = await controllerItem.inserirNovoItem(dados, contentType)

    response.status(result.status_code).json(result)
})

// GET /  -> lista os itens
router.get('/', async function (request, response) {
    let result = await controllerItem.listarItem()

    response.status(result.status_code).json(result)
})

// GET /:id  -> busca um item pelo id
router.get('/:id', async function (request, response) {
    let id = request.params.id

    let result = await controllerItem.buscarItem(id)

    response.status(result.status_code).json(result)
})

// PUT /:id  -> atualiza um item
router.put('/:id', async function (request, response) {
    let id = request.params.id
    let contentType = request.headers['content-type']
    let dados = request.body

    let result = await controllerItem.atualizarItem(dados, id, contentType)

    response.status(result.status_code).json(result)
})

// DELETE /:id  -> exclui um item
router.delete('/:id', async function (request, response) {
    let id = request.params.id

    let result = await controllerItem.excluirItem(id)

    response.status(result.status_code).json(result)
})

module.exports = router