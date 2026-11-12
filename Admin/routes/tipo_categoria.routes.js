/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Tipo de Categoria
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerTipoCategoria = require('../controller/tipo_categoria/tipo_categoria_controler.js')

// Inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerTipoCategoria.inserirNovoTipoCategoria(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// Listar (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerTipoCategoria.listarTipoCategoria()

    response.status(result.status_code)
    response.json(result)
})

// Buscar por ID
router.get('/:id', async function (request, response) {
    let result = await controlerTipoCategoria.buscarTipoCategoria(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerTipoCategoria.atualizarTipoCategoria(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// Excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerTipoCategoria.excluirTipoCategoria(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router