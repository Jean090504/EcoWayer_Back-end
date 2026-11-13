/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_regra_pontuacao_condicao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerRegraCondicao = require('../controller/regra_pontuacao_condicao/regra_pontuacao_condicao_controler.js')

const router = express.Router()

// POST /  -> cria um multiplicador para uma condição da regra
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerRegraCondicao.inserirNovaRegraCondicao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os multiplicadores
router.get('/', async function (request, response) {
    let result = await controllerRegraCondicao.listarRegraCondicoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um multiplicador pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerRegraCondicao.buscarRegraCondicao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um multiplicador (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerRegraCondicao.atualizarRegraCondicao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um multiplicador
router.delete('/:id', async function (request, response) {
    let result = await controllerRegraCondicao.excluirRegraCondicao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router