/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Endereço
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerEndereco = require('../controller/endereco/endereco_controler.js')

// Inserir novo endereço
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerEndereco.inserirNovoEndereco(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os endereços (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerEndereco.listarEndereco()

    response.status(result.status_code)
    response.json(result)
})

// Buscar endereço por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerEndereco.buscarEndereco(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar endereço por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let endereco = request.body

    let result = await controlerEndereco.atualizarEndereco(endereco, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir endereço por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerEndereco.excluirEndereco(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router