/****************************************************************************************************
 *  Objetivo: Rotas de status de usuário (tbl_status_usuario)
 *  Data: 15/10/2026
 *  Autor: Maxw
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json({ limit: '100kb' })

const controlerStatusUsuario = require('../controller/status_usuario/status_usuario_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerStatusUsuario.inserirNovoStatusUsuario(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerStatusUsuario.listarStatusUsuario()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerStatusUsuario.buscarStatusUsuario(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerStatusUsuario.atualizarStatusUsuario(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerStatusUsuario.excluirStatusUsuario(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router