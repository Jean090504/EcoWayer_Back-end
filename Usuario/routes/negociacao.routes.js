/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Negociação
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerNegociacao = require('../controller/negociacao/negociacao_controler.js')

// TODO JWT: ainda não existe middleware de autenticação; quando existir, o id_usuario deve vir do token
// e é preciso conferir se quem propõe participa da conversa (anunciante ou interessado)

// Inserir nova proposta
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerNegociacao.inserirNovoNegociacao(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todas as negociações (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerNegociacao.listarNegociacao()

    response.status(result.status_code)
    response.json(result)
})

// Listar o histórico de propostas de uma conversa (ANTES do /:id)
router.get('/conversa/:id_conversa', async function (request, response) {
    let idConversa = request.params.id_conversa
    let result = await controlerNegociacao.listarNegociacaoConversa(idConversa)

    response.status(result.status_code)
    response.json(result)
})

// Buscar negociação por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNegociacao.buscarNegociacao(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar negociação por ID (valor e status)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let negociacao = request.body

    let result = await controlerNegociacao.atualizarNegociacao(negociacao, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir negociação por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNegociacao.excluirNegociacao(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router