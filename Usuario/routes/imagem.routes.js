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

// Inserir nova imagem
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerImagem.inserirNovaImagem(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todas as imagens (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerImagem.listarImagem()

    response.status(result.status_code)
    response.json(result)
})

// Buscar imagem por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerImagem.buscarImagem(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar imagem por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let imagem = request.body

    let result = await controlerImagem.atualizarImagem(imagem, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir imagem por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerImagem.excluirImagem(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router