/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Tipo de Categoria
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerTipoCategoria = require('../controller/tipo_categoria/tipo_categoria_controler.js')

// Inserir novo tipo de categoria
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerTipoCategoria.inserirNovoTipoCategoria(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os tipos de categoria (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerTipoCategoria.listarTipoCategoria()

    response.status(result.status_code)
    response.json(result)
})
//n--------
// Buscar tipo de categoria por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoCategoria.buscarTipoCategoria(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar tipo de categoria por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let tipoCategoria = request.body

    let result = await controlerTipoCategoria.atualizarTipoCategoria(tipoCategoria, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir tipo de categoria por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoCategoria.excluirTipoCategoria(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router