/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Ponto de Coleta
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerPontoColeta = require('../controller/ponto_coleta/ponto_coleta_controler.js')

// Inserir novo ponto de coleta
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerPontoColeta.inserirNovoPontoColeta(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os pontos de coleta (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerPontoColeta.listarPontoColeta()

    response.status(result.status_code)
    response.json(result)
})

// Buscar ponto de coleta por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerPontoColeta.buscarPontoColeta(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar ponto de coleta por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let ponto = request.body

    let result = await controlerPontoColeta.atualizarPontoColeta(ponto, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir ponto de coleta por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerPontoColeta.excluirPontoColeta(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router