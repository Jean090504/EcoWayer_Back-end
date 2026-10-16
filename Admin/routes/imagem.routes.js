/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Imagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerImagem = require('../controller/imagem/imagem_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerImagem.inserirNovaImagem(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todas (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerImagem.listarImagem()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerImagem.buscarImagem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerImagem.atualizarImagem(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerImagem.excluirImagem(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router