/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_verificacao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerVerificacao = require('../controller/verificacao/verificacao_controler.js')

const router = express.Router()

// POST /  -> cria uma configuração de verificação
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVerificacao.inserirNovaVerificacao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as verificações
router.get('/', async function (request, response) {
    let result = await controllerVerificacao.listarVerificacoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma verificação pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerVerificacao.buscarVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma verificação (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVerificacao.atualizarVerificacao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma verificação (bloqueada se houver e-mail ou telefone vinculado)
router.delete('/:id', async function (request, response) {
    let result = await controllerVerificacao.excluirVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router