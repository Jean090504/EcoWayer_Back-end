/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Denúncia
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerDenuncia = require('../controller/denuncia/denuncia_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerDenuncia.inserirNovaDenuncia(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todas (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerDenuncia.listarDenuncia()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerDenuncia.buscarDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerDenuncia.atualizarDenuncia(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerDenuncia.excluirDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router