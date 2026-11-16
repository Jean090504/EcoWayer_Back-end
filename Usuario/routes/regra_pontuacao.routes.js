/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_regra_pontuacao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerRegraPontuacao = require('../controller/regra_pontuacao/regra_pontuacao_controler.js')

const router = express.Router()

// POST /  -> cria a regra de uma categoria
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerRegraPontuacao.inserirNovaRegraPontuacao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as regras
router.get('/', async function (request, response) {
    let result = await controllerRegraPontuacao.listarRegrasPontuacao()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma regra pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerRegraPontuacao.buscarRegraPontuacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma regra (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerRegraPontuacao.atualizarRegraPontuacao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma regra (bloqueada se houver multiplicadores ou pontos vinculados)
router.delete('/:id', async function (request, response) {
    let result = await controllerRegraPontuacao.excluirRegraPontuacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router