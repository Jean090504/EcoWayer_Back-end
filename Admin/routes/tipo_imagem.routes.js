/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de tipo de imagem
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerTipoImagem = require('../controller/tipo_imagem/tipo_imagem_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerTipoImagem.inserirNovoTipoImagem(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerTipoImagem.listarTipoImagem()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerTipoImagem.buscarTipoImagem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerTipoImagem.atualizarTipoImagem(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerTipoImagem.excluirTipoImagem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router