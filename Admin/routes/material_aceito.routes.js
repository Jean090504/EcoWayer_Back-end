/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Material Aceito
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json({ limit: '100kb' })

const controlerMaterialAceito = require('../controller/material_aceito/material_aceito_controler.js')

// Inserir novo material aceito
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']

    let result = await controlerMaterialAceito.inserirNovoMaterialAceito(dados, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os materiais aceitos (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerMaterialAceito.listarMaterialAceito()

    response.status(result.status_code)
    response.json(result)
})

// Buscar material aceito por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMaterialAceito.buscarMaterialAceito(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar material aceito por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let material = request.body

    let result = await controlerMaterialAceito.atualizarMaterialAceito(material, id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir material aceito por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMaterialAceito.excluirMaterialAceito(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router