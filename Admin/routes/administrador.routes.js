/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Administrador
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAdministrador = require('../controller/administrador/administrador_controler.js')

// Inserir novo administrador
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerAdministrador.inserirNovoAdministrador(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os administradores (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerAdministrador.listarAdministrador()

    response.status(result.status_code)
    response.json(result)
})

// Buscar administrador por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerAdministrador.buscarAdministrador(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar administrador por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let administrador = request.body

    let result = await controlerAdministrador.atualizarAdministrador(administrador, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir administrador por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerAdministrador.excluirAdministrador(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router