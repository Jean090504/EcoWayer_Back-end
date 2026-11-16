/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_modalidade
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerModalidade = require('../controller/modalidade/modalidade_controler.js')

const router = express.Router()

// POST /  -> cria uma modalidade
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerModalidade.inserirNovaModalidade(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as modalidades
router.get('/', async function (request, response) {
    let result = await controllerModalidade.listarModalidades()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma modalidade pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerModalidade.buscarModalidade(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma modalidade (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerModalidade.atualizarModalidade(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma modalidade (bloqueada se houver anúncio usando)
router.delete('/:id', async function (request, response) {
    let result = await controllerModalidade.excluirModalidade(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router