/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Item
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json({ limit: '100kb' })

const controllerItem = require('../controller/item/item_controler.js')

// Inserir novo item
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controllerItem.inserirNovoItem(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os itens (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controllerItem.listarItem()

    response.status(result.status_code)
    response.json(result)
})

// Buscar item por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controllerItem.buscarItem(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar item por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let item = request.body

    let result = await controllerItem.atualizarItem(item, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir item por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controllerItem.excluirItem(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router