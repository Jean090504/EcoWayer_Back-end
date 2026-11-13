/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Notificação
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerNotificacao = require('../controller/notificacao/notificacao_controler.js')

// Criar nova notificação
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerNotificacao.inserirNovaNotificacao(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar as notificações de um usuário (ANTES do /:id).
// Obrigatório: ?id_usuario=1. Opcional: &nao_lidas=true para trazer só as não lidas.
router.get('/', async function (request, response) {
    let idUsuario = request.query.id_usuario
    let naoLidas = request.query.nao_lidas

    let result = await controlerNotificacao.listarNotificacao(idUsuario, naoLidas)

    response.status(result.status_code)
    response.json(result)
})

// Buscar notificação por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNotificacao.buscarNotificacao(id)

    response.status(result.status_code)
    response.json(result)
})

// Marcar notificação como lida: PUT com { "lida": true }
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let notificacao = request.body

    let result = await controlerNotificacao.atualizarNotificacao(notificacao, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir notificação por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNotificacao.excluirNotificacao(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router