/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_tipo_modalidade
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerTipoModalidade = require('../controller/tipo_modalidade/tipo_modalidade_controler.js')

const router = express.Router()

// POST /  -> cria um tipo de modalidade
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTipoModalidade.inserirNovoTipoModalidade(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os tipos
router.get('/', async function (request, response) {
    let result = await controllerTipoModalidade.listarTiposModalidade()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um tipo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerTipoModalidade.buscarTipoModalidade(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um tipo (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTipoModalidade.atualizarTipoModalidade(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um tipo (bloqueado se houver modalidade usando)
router.delete('/:id', async function (request, response) {
    let result = await controllerTipoModalidade.excluirTipoModalidade(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router