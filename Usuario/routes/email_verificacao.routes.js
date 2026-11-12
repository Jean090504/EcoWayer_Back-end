/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_email_verificacao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerEmailVerificacao = require('../controller/email_verificacao/email_verificacao_controler.js')

const router = express.Router()

// POST /  -> vincula um e-mail a uma verificação
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEmailVerificacao.inserirNovoEmailVerificacao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os vínculos
router.get('/', async function (request, response) {
    let result = await controllerEmailVerificacao.listarEmailVerificacoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um vínculo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerEmailVerificacao.buscarEmailVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um vínculo (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEmailVerificacao.atualizarEmailVerificacao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um vínculo
router.delete('/:id', async function (request, response) {
    let result = await controllerEmailVerificacao.excluirEmailVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router