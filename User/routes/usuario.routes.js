/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Usuário
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerUsuario = require('../controller/usuario/usuario_controler.js')

// Cadastrar novo usuário (cria também e-mail, telefone, conta e vínculo com o endereço)
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerUsuario.inserirNovoUsuario(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os usuários (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerUsuario.listarUsuario()

    response.status(result.status_code)
    response.json(result)
})

// Buscar usuário por ID (inclui os endereços)
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerUsuario.buscarUsuario(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar perfil do usuário por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let usuario = request.body

    let result = await controlerUsuario.atualizarUsuario(usuario, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Desativar (excluir) usuário por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerUsuario.excluirUsuario(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router