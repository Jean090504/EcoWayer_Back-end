/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Tipo de Imagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerTipoImagem = require('../controller/tipo_imagem/tipo_imagem_controler.js')

// Inserir novo tipo de imagem
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerTipoImagem.inserirNovoTipoImagem(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os tipos de imagem (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerTipoImagem.listarTipoImagem()

    response.status(result.status_code)
    response.json(result)
})

// Buscar tipo de imagem por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoImagem.buscarTipoImagem(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar tipo de imagem por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let tipoImagem = request.body

    let result = await controlerTipoImagem.atualizarTipoImagem(tipoImagem, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir tipo de imagem por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoImagem.excluirTipoImagem(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router