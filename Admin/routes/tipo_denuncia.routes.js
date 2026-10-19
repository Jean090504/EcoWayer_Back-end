/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Tipo de Denúncia
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json({ limit: '100kb' })

const controlerTipoDenuncia = require('../controller/tipo_denuncia/tipo_denuncia_controler.js')

// Inserir novo tipo de denúncia
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerTipoDenuncia.inserirNovoTipoDenuncia(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os tipos de denúncia (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerTipoDenuncia.listarTipoDenuncia()

    response.status(result.status_code)
    response.json(result)
})

// Buscar tipo de denúncia por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoDenuncia.buscarTipoDenuncia(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar tipo de denúncia por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let tipoDenuncia = request.body

    let result = await controlerTipoDenuncia.atualizarTipoDenuncia(tipoDenuncia, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir tipo de denúncia por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerTipoDenuncia.excluirTipoDenuncia(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router