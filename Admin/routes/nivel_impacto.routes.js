/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de nível de impacto
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerNivelImpacto = require('../controller/nivel_impacto/nivel_impacto_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerNivelImpacto.inserirNovoNivelImpacto(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerNivelImpacto.listarNivelImpacto()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerNivelImpacto.buscarNivelImpacto(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerNivelImpacto.atualizarNivelImpacto(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerNivelImpacto.excluirNivelImpacto(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router