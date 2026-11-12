/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Mensagens
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerMensagens = require('../controller/mensagens/mensagens_controler.js')

// Enviar nova mensagem (também gera a notificação para a outra pessoa da conversa)
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerMensagens.inserirNovaMensagem(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar as mensagens de uma conversa (ANTES do /:id). Obrigatório: ?id_conversa=1
router.get('/', async function (request, response) {
    let idConversa = request.query.id_conversa

    let result = await controlerMensagens.listarMensagem(idConversa)

    response.status(result.status_code)
    response.json(result)
})

// Buscar mensagem por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMensagens.buscarMensagem(id)

    response.status(result.status_code)
    response.json(result)
})

// Marcar mensagem como lida: PUT com { "lida": true }
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let mensagem = request.body

    let result = await controlerMensagens.atualizarMensagem(mensagem, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir mensagem por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMensagens.excluirMensagem(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router