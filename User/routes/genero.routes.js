/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Gênero
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerGenero = require('../controller/genero/genero_controler.js')

// Inserir novo gênero
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerGenero.inserirNovoGenero(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os gêneros (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerGenero.listarGenero()

    response.status(result.status_code)
    response.json(result)
})

// Buscar gênero por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerGenero.buscarGenero(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar gênero por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let genero = request.body

    let result = await controlerGenero.atualizarGenero(genero, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir gênero por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerGenero.excluirGenero(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router