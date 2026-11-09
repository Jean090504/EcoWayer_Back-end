/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Categoria
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerCategoria = require('../controller/categoria/categoria_controler.js')

// Inserir nova categoria
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerCategoria.inserirNovoCategoria(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todas as categorias (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerCategoria.listarCategoria()

    response.status(result.status_code)
    response.json(result)
})

// Buscar categoria por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerCategoria.buscarCategoria(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar categoria por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let categoria = request.body

    let result = await controlerCategoria.atualizarCategoria(categoria, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir categoria por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerCategoria.excluirCategoria(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router