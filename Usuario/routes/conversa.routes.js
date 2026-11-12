/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Conversa
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerConversa = require('../controller/conversa/conversa_controler.js')

// Abrir nova conversa sobre um anúncio
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerConversa.inserirNovaConversa(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar conversas (ANTES do /:id). Use ?id_usuario=1 para listar só as conversas de um usuário.
router.get('/', async function (request, response) {
    let idUsuario = request.query.id_usuario

    let result = await controlerConversa.listarConversa(idUsuario)

    response.status(result.status_code)
    response.json(result)
})

// Buscar conversa por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerConversa.buscarConversa(id)

    response.status(result.status_code)
    response.json(result)
})

// Excluir conversa por ID (só se não tiver mensagens nem propostas)
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerConversa.excluirConversa(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router