/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Nível de Impacto
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerNivelImpacto = require('../controller/nivel_impacto/nivel_impacto_controler.js')

// Inserir novo nível de impacto
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerNivelImpacto.inserirNovoNivelImpacto(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os níveis de impacto (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerNivelImpacto.listarNivelImpacto()

    response.status(result.status_code)
    response.json(result)
})

// Buscar nível de impacto por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNivelImpacto.buscarNivelImpacto(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar nível de impacto por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let nivelImpacto = request.body

    let result = await controlerNivelImpacto.atualizarNivelImpacto(nivelImpacto, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir nível de impacto por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerNivelImpacto.excluirNivelImpacto(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router